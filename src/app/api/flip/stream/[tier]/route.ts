import { getRoomsForTier, cleanupStaleRooms } from "@/lib/flip/flipService";
import { addListener, removeListener } from "@/lib/flip/flipBroadcast";
import { isValidFlipTier } from "@/lib/flip/flipTiers";
import { flipTierToLamports } from "@/lib/flip/flipTiers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tier: string }> }
) {
  const { tier: tierStr } = await params;
  const tier = parseFloat(tierStr);

  if (isNaN(tier) || !isValidFlipTier(tier)) {
    return new Response("Invalid tier", { status: 400 });
  }

  // Lazy cleanup on connect (fire and forget)
  cleanupStaleRooms(tier).catch((err) =>
    console.error(`[FLIP SSE] Cleanup error for tier ${tier}:`, err)
  );

  // Fetch initial rooms BEFORE creating the stream
  let initialRooms: unknown[];
  try {
    initialRooms = await getRoomsForTier(tier);
  } catch (err) {
    console.error(`[FLIP SSE] Error fetching rooms for tier ${tier}:`, err);
    initialRooms = [];
  }

  const encoder = new TextEncoder();
  const tierKey = flipTierToLamports(tier).toString();
  let controllerRef: ReadableStreamDefaultController | null = null;
  let keepaliveInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      addListener(tierKey, controller);

      // Send initial state immediately (data already fetched)
      const payload = `event: init\ndata: ${JSON.stringify(initialRooms)}\n\n`;
      controller.enqueue(encoder.encode(payload));

      // Keepalive every 30s
      keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          if (keepaliveInterval) clearInterval(keepaliveInterval);
        }
      }, 30000);
    },
    cancel() {
      if (controllerRef) {
        removeListener(tierKey, controllerRef);
      }
      if (keepaliveInterval) {
        clearInterval(keepaliveInterval);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
