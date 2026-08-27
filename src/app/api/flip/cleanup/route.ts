import { NextResponse } from "next/server";
import { cleanupStaleRooms } from "@/lib/flip/flipService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const expected = process.env.MAINTENANCE_SECRET;

  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await cleanupStaleRooms();
    return NextResponse.json({
      message: "Cleanup complete",
      staleRefunded: result.staleRefunded,
      stuckResolved: result.stuckResolved,
      reservationsExpired: result.reservationsExpired,
      payoutsRetried: result.payoutsRetried,
    });
  } catch (error) {
    console.error("Error in /api/flip/cleanup:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
