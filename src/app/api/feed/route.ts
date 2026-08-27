import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { truncateWallet } from "@/lib/utils";

export async function GET() {
  try {
    const wins = await prisma.ticket.findMany({
      where: {
        totalPayoutLamports: { gt: 0n },
        status: { in: ["scratched", "paid"] },
      },
      orderBy: { scratchedAt: "desc" },
      take: 20,
      select: {
        playerWallet: true,
        totalPayoutLamports: true,
        zone1Result: true,
        zone2Result: true,
        tier: true,
        scratchedAt: true,
      },
    });

    const feed = wins.map((w) => {
      const z1 = w.zone1Result as { label: string; payoutLamports: string } | null;
      const z2 = w.zone2Result as { label: string; payoutLamports: string } | null;
      const type =
        z2 && BigInt(z2.payoutLamports) > 0n
          ? z2.label
          : z1
            ? z1.label
            : "Win";

      return {
        wallet: truncateWallet(w.playerWallet),
        amountLamports: w.totalPayoutLamports.toString(),
        amount: Number(w.totalPayoutLamports) / 1_000_000_000,
        type,
        tier: w.tier,
        timestamp: w.scratchedAt?.toISOString() ?? "",
      };
    });

    return NextResponse.json(feed, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (error) {
    console.error("Error in /api/feed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
