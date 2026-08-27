import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { truncateWallet } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const history = await prisma.flipHistory.findMany({
      orderBy: { completedAt: "desc" },
      take: 20,
      select: {
        id: true,
        tierLamports: true,
        playerAWallet: true,
        playerBWallet: true,
        winnerWallet: true,
        result: true,
        potLamports: true,
        payoutLamports: true,
        payoutTx: true,
        serverSeedHash: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      history: history.map((h) => ({
        id: h.id,
        tierLamports: h.tierLamports.toString(),
        potLamports: h.potLamports.toString(),
        payoutLamports: h.payoutLamports.toString(),
        payoutTx: h.payoutTx,
        result: h.result,
        serverSeedHash: h.serverSeedHash,
        playerAWallet: truncateWallet(h.playerAWallet),
        playerBWallet: truncateWallet(h.playerBWallet),
        winnerWallet: truncateWallet(h.winnerWallet),
        completedAt: h.completedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error in /api/flip/history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
