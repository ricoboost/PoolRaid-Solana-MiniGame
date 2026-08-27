"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { PoolData } from "@/types";
import { lamportsToSolNumber } from "@/lib/money";

export function usePools() {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const paused = useRef(false);

  const refresh = useCallback(async () => {
    if (paused.current) return;
    try {
      const res = await fetch("/api/pools");
      if (res.ok) {
        const data = await res.json() as Array<{
          tier: PoolData["tier"];
          balanceLamports: string;
          rawBalanceLamports: string;
          totalInLamports: string;
          totalOutLamports: string;
          ticketPriceLamports: string;
          ticketCount: number;
          isActive: boolean;
          bootstrapPhase: PoolData["bootstrapPhase"];
          houseCutPct: number;
          ticketsToNextPhase: number;
          isLocked: boolean;
        }>;
        setPools(data.map((pool) => ({
          ...pool,
          balance: lamportsToSolNumber(pool.balanceLamports),
          rawBalance: lamportsToSolNumber(pool.rawBalanceLamports),
          totalIn: lamportsToSolNumber(pool.totalInLamports),
          totalOut: lamportsToSolNumber(pool.totalOutLamports),
          ticketPrice: lamportsToSolNumber(pool.ticketPriceLamports),
        })));
      }
    } catch (err) {
      console.error("Failed to fetch pools:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const pause = useCallback(() => {
    paused.current = true;
  }, []);

  const resume = useCallback(() => {
    paused.current = false;
    refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { pools, loading, refresh, pause, resume };
}
