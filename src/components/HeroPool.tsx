"use client";

import { AnimatedNumber } from "./AnimatedNumber";
import type { PoolData } from "@/types";

interface HeroPoolProps {
  pools: PoolData[];
}

export function HeroPool({ pools }: HeroPoolProps) {
  const total = pools.reduce((sum, p) => sum + p.balance, 0);
  const totalTickets = pools.reduce((sum, p) => sum + p.ticketCount, 0);

  return (
    <section className="text-center pt-5 pb-6 relative">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(212,166,66,0.07) 0%, transparent 70%)", filter: "blur(30px)" }} />

      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-text-muted mb-3">
        Total Prize Pools
      </p>
      <AnimatedNumber
        value={total}
        className="font-display text-[46px] font-black tracking-[-0.03em] text-text-white leading-none"
        suffix="SOL"
        format={(n) => n.toFixed(3)}
      />
      <div className="flex items-center justify-center gap-4 mt-2.5">
        <span className="font-mono text-[9px] text-text-muted">
          {totalTickets} scratched
        </span>
        <span className="w-px h-3 bg-[--border-faint]" />
        <span className="font-mono text-[9px] text-text-muted">
          {pools.filter(p => p.isActive).length} tiers
        </span>
      </div>
    </section>
  );
}
