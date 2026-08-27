import { NextResponse } from "next/server";
import { leaveRoom } from "@/lib/flip/flipService";
import { requireWallet } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = requireWallet(request);
    const { roomId } = await request.json();

    if (!roomId) return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    const updatedRoom = await leaveRoom(roomId, session.wallet);

    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = ["Unauthorized", "Invalid origin"].includes(message) ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
