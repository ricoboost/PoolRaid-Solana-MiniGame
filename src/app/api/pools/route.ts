import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRaidableBalance } from "@/lib/pool";
import { getBootstrapPhase, getHouseCutPct } from "@/lib/payout";
import type { Tier } from "@/types";

export async function GET() {
  try {
    const [pools, configs] = await Promise.all([
      prisma.pool.findMany(),
      prisma.gameConfig.findMany(),
    ]);

    const configMap = new Map(configs.map((c) => [c.tier, c]));

    const data = pools.map((pool) => {
      const config = configMap.get(pool.tier);
      const phase = getBootstrapPhase(pool.ticketCount);
      return {
        tier: pool.tier,
        balanceLamports: getRaidableBalance(pool.balanceLamports, pool.tier as Tier, pool.ticketCount).toString(),
        rawBalanceLamports: pool.balanceLamports.toString(),
        totalInLamports: pool.totalInLamports.toString(),
        totalOutLamports: pool.totalOutLamports.toString(),
        ticketCount: pool.ticketCount,
        ticketPriceLamports: (config?.ticketPriceLamports ?? 0n).toString(),
        isActive: config?.isActive ?? false,
        bootstrapPhase: phase,
        houseCutPct: getHouseCutPct(pool.ticketCount),
        ticketsToNextPhase: phase === "seeding" ? 20 - pool.ticketCount : phase === "growing" ? 100 - pool.ticketCount : 0,
        isLocked: (config?.ticketPriceLamports ?? 0n) >= 1_000_000_000n && pool.ticketCount === 0 && pool.balanceLamports < (config?.ticketPriceLamports ?? 0n),
      };
    });

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (error) {
    console.error("Error in /api/pools:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
