import { prisma } from "@/lib/prisma";
import { truncateWallet, formatLamports } from "@/lib/utils";
import { LeaderboardTabs } from "./LeaderboardTabs";
import { LeaderboardSidebar } from "./LeaderboardSidebar";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    biggestAllTime, biggestToday, biggestWeek,
    topScratchers, luckiest, topStreaks, topLevels,
    pools,
    flipBiggestAllTime, flipBiggestToday, flipBiggestWeek,
    flipMostActive, flipLuckiest,
  ] = await Promise.all([
    // Scratch data
    prisma.ticket.findMany({
      where: { totalPayoutLamports: { gt: 0n }, status: { in: ["scratched", "paid"] } },
      orderBy: { totalPayoutLamports: "desc" },
      take: 10,
      select: { playerWallet: true, totalPayoutLamports: true, tier: true },
    }),
    prisma.ticket.findMany({
      where: { totalPayoutLamports: { gt: 0n }, status: { in: ["scratched", "paid"] }, scratchedAt: { gte: todayStart } },
      orderBy: { totalPayoutLamports: "desc" },
      take: 10,
      select: { playerWallet: true, totalPayoutLamports: true, tier: true },
    }),
    prisma.ticket.findMany({
      where: { totalPayoutLamports: { gt: 0n }, status: { in: ["scratched", "paid"] }, scratchedAt: { gte: weekStart } },
      orderBy: { totalPayoutLamports: "desc" },
      take: 10,
      select: { playerWallet: true, totalPayoutLamports: true, tier: true },
    }),
    prisma.ticket.groupBy({
      by: ["playerWallet"],
      where: { status: { in: ["scratched", "paid"] } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.ticket.groupBy({
      by: ["playerWallet"],
      where: { totalPayoutLamports: { gt: 0n } },
      _sum: { totalPayoutLamports: true },
      orderBy: { _sum: { totalPayoutLamports: "desc" } },
      take: 10,
    }),
    prisma.playerProfile.findMany({
      where: { bestStreak: { gt: 0 } },
      orderBy: { bestStreak: "desc" },
      take: 10,
      select: { wallet: true, bestStreak: true, level: true },
    }),
    prisma.playerProfile.findMany({
      where: { totalXp: { gt: 0 } },
      orderBy: { totalXp: "desc" },
      take: 10,
      select: { wallet: true, totalXp: true, level: true },
    }),
    prisma.pool.findMany(),

    // Flip data
    prisma.flipHistory.findMany({
      orderBy: { payoutLamports: "desc" },
      take: 10,
      select: { winnerWallet: true, payoutLamports: true, tierLamports: true },
    }),
    prisma.flipHistory.findMany({
      where: { completedAt: { gte: todayStart } },
      orderBy: { payoutLamports: "desc" },
      take: 10,
      select: { winnerWallet: true, payoutLamports: true, tierLamports: true },
    }),
    prisma.flipHistory.findMany({
      where: { completedAt: { gte: weekStart } },
      orderBy: { payoutLamports: "desc" },
      take: 10,
      select: { winnerWallet: true, payoutLamports: true, tierLamports: true },
    }),
    prisma.$queryRaw<{ wallet: string; count: bigint }[]>`
      SELECT w.wallet, COUNT(*) as count FROM (
        SELECT "playerAWallet" as wallet FROM "FlipHistory"
        UNION ALL
        SELECT "playerBWallet" as wallet FROM "FlipHistory"
      ) w GROUP BY w.wallet ORDER BY count DESC LIMIT 10
    `,
    prisma.$queryRaw<{ wallet: string; total: bigint }[]>`
      SELECT "winnerWallet" as wallet, SUM("payoutLamports") as total
      FROM "FlipHistory"
      GROUP BY "winnerWallet"
      ORDER BY total DESC
      LIMIT 10
    `,
  ]);

  const totalPoolLamports = pools.reduce((sum, pool) => sum + pool.balanceLamports, 0n);
  const totalTickets = pools.reduce((s, p) => s + p.ticketCount, 0);

  const data = {
    // Scratch
    biggestAllTime: biggestAllTime.map((w) => ({ wallet: truncateWallet(w.playerWallet), value: `${formatLamports(w.totalPayoutLamports)} SOL`, sub: w.tier })),
    biggestToday: biggestToday.map((w) => ({ wallet: truncateWallet(w.playerWallet), value: `${formatLamports(w.totalPayoutLamports)} SOL`, sub: w.tier })),
    biggestWeek: biggestWeek.map((w) => ({ wallet: truncateWallet(w.playerWallet), value: `${formatLamports(w.totalPayoutLamports)} SOL`, sub: w.tier })),
    topScratchers: topScratchers.map((s) => ({ wallet: truncateWallet(s.playerWallet), value: `${s._count.id} tickets` })),
    luckiest: luckiest.map((l) => ({ wallet: truncateWallet(l.playerWallet), value: `${formatLamports(l._sum.totalPayoutLamports ?? 0n)} SOL` })),
    topStreaks: topStreaks.map((s) => ({ wallet: truncateWallet(s.wallet), value: `${s.bestStreak} streak`, sub: `Lv.${s.level}` })),
    topLevels: topLevels.map((l) => ({ wallet: truncateWallet(l.wallet), value: `${l.totalXp} XP`, sub: `Lv.${l.level}` })),

    // Flip
    flipBiggestAllTime: flipBiggestAllTime.map((w) => ({ wallet: truncateWallet(w.winnerWallet), value: `${formatLamports(w.payoutLamports)} SOL`, sub: `${formatLamports(w.tierLamports)} tier` })),
    flipBiggestToday: flipBiggestToday.map((w) => ({ wallet: truncateWallet(w.winnerWallet), value: `${formatLamports(w.payoutLamports)} SOL`, sub: `${formatLamports(w.tierLamports)} tier` })),
    flipBiggestWeek: flipBiggestWeek.map((w) => ({ wallet: truncateWallet(w.winnerWallet), value: `${formatLamports(w.payoutLamports)} SOL`, sub: `${formatLamports(w.tierLamports)} tier` })),
    flipMostActive: flipMostActive.map((s) => ({ wallet: truncateWallet(s.wallet), value: `${Number(s.count)} flips` })),
    flipLuckiest: flipLuckiest.map((l) => ({ wallet: truncateWallet(l.wallet), value: `${formatLamports(l.total)} SOL` })),
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <LeaderboardSidebar totalPool={Number(totalPoolLamports) / 1_000_000_000} totalTickets={totalTickets} />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[900px] mx-auto w-full">
        <h1 className="font-display text-2xl font-black text-on-surface mb-1">Leaderboard</h1>
        <p className="font-mono text-[12px] text-text-muted mb-6">Top players across all games</p>
        <LeaderboardTabs data={data} />
      </main>
    </div>
  );
}
