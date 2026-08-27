import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWallet } from "@/lib/auth";
import { checkRateLimit } from "@/lib/security";
import { countActiveSeats, reserveRoom } from "@/lib/flip/flipService";
import { getPoolAddress } from "@/lib/solana";

export async function POST(request: Request) {
  try {
    if (process.env.FLIP_ENABLED === "false") return NextResponse.json({ error: "Coin flip is disabled" }, { status: 503 });
    const session = requireWallet(request);
    const { roomId, side } = await request.json();
    if (typeof roomId !== "string" || !["heads", "tails"].includes(side)) {
      return NextResponse.json({ error: "Invalid room or side" }, { status: 400 });
    }
    const excluded = await prisma.selfExclusion.findFirst({
      where: { walletAddress: session.wallet, excludeUntil: { gt: new Date() } },
    });
    if (excluded) return NextResponse.json({ error: "Your wallet is self-excluded" }, { status: 403 });
    if (!(await checkRateLimit(session.wallet, "flip_sit"))) {
      return NextResponse.json({ error: "Wait ten seconds before reserving another seat" }, { status: 429 });
    }
    if (await countActiveSeats(session.wallet) >= 6) {
      return NextResponse.json({ error: "Maximum six active seats allowed" }, { status: 409 });
    }
    const reservation = await reserveRoom(roomId, session.wallet, side);
    return NextResponse.json({
      reservationId: reservation.id,
      depositAddress: getPoolAddress().toBase58(),
      amountLamports: reservation.amountLamports.toString(),
      memo: reservation.memo,
      expiresAt: reservation.expiresAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reserve room";
    const status = ["Unauthorized", "Invalid origin"].includes(message) ? 401 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
