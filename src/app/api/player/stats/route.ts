import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidSolanaAddress } from "@/lib/security";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    const isOwner = getSession(request)?.wallet === wallet;

    if (!wallet || !isValidSolanaAddress(wallet)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const requestedProfile = await prisma.playerProfile.findUnique({ where: { wallet } });
    if (!isOwner && !requestedProfile?.isPublic) {
      return NextResponse.json({ error: "Profile is private" }, { status: 403 });
    }

    const [tickets, profile, achievements] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          playerWallet: wallet,
          status: { in: ["scratched", "paid"] },
        },
        select: { priceLamports: true, totalPayoutLamports: true, isFreeTicket: true, status: true },
      }),
      Promise.resolve(requestedProfile),
      prisma.achievement.findMany({
        where: { wallet },
        select: { achievementId: true, unlockedAt: true },
        orderBy: { unlockedAt: "desc" },
      }),
    ]);

    const totalWagered = tickets
      .filter((t) => !t.isFreeTicket)
      .reduce((sum, t) => sum + t.priceLamports, 0n);
    const totalWon = tickets.reduce((sum, t) => sum + t.totalPayoutLamports, 0n);
    const totalTickets = tickets.length;
    const winningTickets = tickets.filter((t) => t.totalPayoutLamports > 0n).length;
    const unclaimed = tickets.filter(
      (t) => t.status === "scratched" && t.totalPayoutLamports > 0n
    ).length;
    const unclaimedAmount = tickets
      .filter((t) => t.status === "scratched" && t.totalPayoutLamports > 0n)
      .reduce((sum, t) => sum + t.totalPayoutLamports, 0n);

    return NextResponse.json({
      totalWageredLamports: totalWagered.toString(),
      totalWonLamports: totalWon.toString(),
      netPnlLamports: (totalWon - totalWagered).toString(),
      totalWagered: Number(totalWagered) / 1_000_000_000,
      totalWon: Number(totalWon) / 1_000_000_000,
      netPnl: Number(totalWon - totalWagered) / 1_000_000_000,
      totalTickets,
      winningTickets,
      winRate: totalTickets > 0 ? (winningTickets / totalTickets) * 100 : 0,
      freeTickets: tickets.filter((t) => t.isFreeTicket).length,
      ...(isOwner ? { unclaimed, unclaimedAmountLamports: unclaimedAmount.toString(), unclaimedAmount: Number(unclaimedAmount) / 1_000_000_000 } : {}),
      currentStreak: profile?.currentStreak ?? 0,
      bestStreak: profile?.bestStreak ?? 0,
      totalXp: profile?.totalXp ?? 0,
      level: profile?.level ?? 0,
      achievements: achievements.map((a) => ({
        achievementId: a.achievementId,
        unlockedAt: a.unlockedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error in /api/player/stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
