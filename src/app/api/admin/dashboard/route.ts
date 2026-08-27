import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";
import { connection, getPoolKeypair } from "@/lib/solana";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Hot wallet balance
    let hotWalletBalance = 0;
    try {
      const keypair = getPoolKeypair();
      const lamports = await connection.getBalance(keypair.publicKey);
      hotWalletBalance = lamports / LAMPORTS_PER_SOL;
    } catch { /* ignore RPC errors */ }

    // Flip stats
    const [flipCount, flipVolume, flipRake] = await Promise.all([
      prisma.flipHistory.count(),
      prisma.flipHistory.aggregate({ _sum: { potLamports: true } }),
      prisma.flipHistory.aggregate({ _sum: { houseRakeLamports: true } }),
    ]);

    // Rate limit table size (health indicator)
    const rateLimitCount = await prisma.rateLimit.count();

    const [houseProfit, pools, todayTickets, recentPayouts, configs] = await Promise.all([
      prisma.houseProfit.findFirst(),
      prisma.pool.findMany(),
      prisma.ticket.findMany({
        where: { createdAt: { gte: todayStart }, status: { in: ["scratched", "paid", "funded"] } },
        select: { priceLamports: true, totalPayoutLamports: true, isFreeTicket: true, playerWallet: true, zone2Result: true, tier: true },
      }),
      prisma.ticket.findMany({
        where: { totalPayoutLamports: { gt: 0n }, status: { in: ["scratched", "paid"] } },
        orderBy: { scratchedAt: "desc" },
        take: 50,
        select: {
          id: true, scratchedAt: true, playerWallet: true, tier: true,
          zone1Result: true, zone2Result: true, totalPayoutLamports: true, payoutTx: true,
        },
      }),
      prisma.gameConfig.findMany(),
    ]);

    // Today's stats
    const todayPaid = todayTickets.filter((t) => !t.isFreeTicket);
    const uniqueWallets = new Set(todayTickets.map((t) => t.playerWallet)).size;
    const freeTickets = todayTickets.filter((t) => t.isFreeTicket).length;
    const raids = todayTickets.filter((t) => {
      const z2 = t.zone2Result as { payoutLamports?: string } | null;
      return z2 && BigInt(z2.payoutLamports ?? "0") > 0n;
    }).length;
    const todayPayouts = todayTickets.reduce((s, t) => s + t.totalPayoutLamports, 0n);
    const todayVolume = todayPaid.reduce((s, t) => s + t.priceLamports, 0n);
    const todayHouseProfit = todayVolume * 1_000n / 10_000n;

    let biggestWin = { amount: 0n, tier: "", type: "", wallet: "" };
    for (const t of todayTickets) {
      if (t.totalPayoutLamports > biggestWin.amount) {
        const z2 = t.zone2Result as { label?: string; payoutLamports?: string } | null;
        biggestWin = {
          amount: t.totalPayoutLamports,
          tier: t.tier,
          type: z2 && BigInt(z2.payoutLamports ?? "0") > 0n ? (z2.label ?? "raid") : "instant",
          wallet: t.playerWallet.slice(0, 4) + "..." + t.playerWallet.slice(-4),
        };
      }
    }

    // Paused status
    const pausedTiers = configs.filter((c) => !c.isActive).map((c) => c.tier);

    // Flagged — large payouts
    const flagged = recentPayouts
      .filter((t) => {
        const thresholds: Record<string, bigint> = { micro: 50_000_000n, mini: 500_000_000n, standard: 5_000_000_000n, gold: 50_000_000_000n, diamond: 200_000_000_000n, black: 500_000_000_000n };
        return t.totalPayoutLamports > (thresholds[t.tier] || 50_000_000_000n);
      })
      .map((t) => ({
        time: t.scratchedAt?.toISOString() ?? "",
        wallet: t.playerWallet.slice(0, 4) + "..." + t.playerWallet.slice(-4),
        amount: Number(t.totalPayoutLamports) / 1_000_000_000,
        reason: `Large payout for ${t.tier} tier`,
      }));

    return NextResponse.json({
      hotWallet: {
        address: getPoolKeypair().publicKey.toBase58(),
        balance: hotWalletBalance,
      },
      houseProfit: {
        unclaimed: Number(houseProfit?.totalProfitLamports ?? 0n) / 1_000_000_000,
      },
      pools: pools.map((p) => ({
        tier: p.tier,
        balance: Number(p.balanceLamports) / 1_000_000_000,
        ticketCount: p.ticketCount,
        totalIn: Number(p.totalInLamports) / 1_000_000_000,
        totalOut: Number(p.totalOutLamports) / 1_000_000_000,
      })),
      today: {
        ticketsSold: todayPaid.length,
        volume: Number(todayVolume) / 1_000_000_000,
        payouts: Number(todayPayouts) / 1_000_000_000,
        houseProfit: Number(todayHouseProfit) / 1_000_000_000,
        uniqueWallets,
        freeTickets,
        poolRaids: raids,
        biggestWin: { ...biggestWin, amount: Number(biggestWin.amount) / 1_000_000_000 },
      },
      recentPayouts: recentPayouts.map((t) => {
        const z2 = t.zone2Result as { label?: string; payoutLamports?: string } | null;
        return {
          id: t.id,
          time: t.scratchedAt?.toISOString() ?? "",
          wallet: t.playerWallet.slice(0, 4) + "..." + t.playerWallet.slice(-4),
          tier: t.tier,
          type: z2 && BigInt(z2.payoutLamports ?? "0") > 0n ? (z2.label ?? "raid") : "instant",
          amount: Number(t.totalPayoutLamports) / 1_000_000_000,
          tx: t.payoutTx,
        };
      }),
      flagged,
      flipStats: {
        totalFlips: flipCount,
        totalVolume: Number(flipVolume._sum.potLamports ?? 0n) / 1_000_000_000,
        totalRake: Number(flipRake._sum.houseRakeLamports ?? 0n) / 1_000_000_000,
      },
      systemStatus: {
        salesPaused: pausedTiers.length === 6,
        pausedTiers,
        dbHealth: "ok",
        rateLimitTableSize: rateLimitCount,
        hotWalletLow: hotWalletBalance < 0.1,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
