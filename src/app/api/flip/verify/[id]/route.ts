import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check FlipHistory first (completed games)
    const history = await prisma.flipHistory.findUnique({ where: { id } });

    if (history) {
      return NextResponse.json({
        id: history.id,
        tierLamports: history.tierLamports.toString(),
        playerAWallet: history.playerAWallet,
        playerBWallet: history.playerBWallet,
        winnerWallet: history.winnerWallet,
        result: history.result,
        potLamports: history.potLamports.toString(),
        payoutLamports: history.payoutLamports.toString(),
        payoutTx: history.payoutTx,
        serverSeed: history.serverSeed,
        serverSeedHash: history.serverSeedHash,
        completedAt: history.completedAt.toISOString(),
      });
    }

    // Fallback: check active room (for in-progress games)
    const room = await prisma.flipRoom.findUnique({ where: { id } });
    if (!room) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: room.id,
      tierLamports: room.tierLamports.toString(),
      playerAWallet: room.playerAWallet,
      playerBWallet: room.playerBWallet,
      winnerWallet: room.status === "completed" ? room.winnerWallet : null,
      result: room.status === "completed" ? room.result : null,
      serverSeed: room.status === "completed" ? room.serverSeed : null,
      serverSeedHash: room.serverSeedHash,
      status: room.status,
    });
  } catch (error) {
    console.error("Error in /api/flip/verify:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
