"use client";

import { AnimatedNumber } from "./AnimatedNumber";
import { getTierConfig, getTierColor } from "@/lib/tiers";
import type { Tier, PoolData } from "@/types";
import Image from "next/image";

interface PoolDisplayProps {
  tier: Tier;
  pools: PoolData[];
}

export function PoolDisplay({ tier, pools }: PoolDisplayProps) {
  const pool = pools.find((p) => p.tier === tier);
  const config = getTierConfig(tier);

  if (!pool) return null;

  const tierColor = getTierColor(tier);
  const maxBalance = Math.max(pool.totalIn, 0.001);
  const fillPct = Math.min((pool.balance / maxBalance) * 100, 100);

  return (
    <section className="rounded-xl bg-surface-container p-5 mb-5 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(52,254,160,0.04) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Image
            src={`/images/tiers/${tier}_coin.webp`}
            alt={config.label}
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
            {config.label} Pool
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative w-[5px] h-[5px]">
            <span className="absolute inset-0 rounded-full bg-primary animate-[livePulse_2s_ease-in-out_infinite]" />
            <span className="absolute inset-0 rounded-full bg-primary animate-[ping_2s_ease-in-out_infinite]" />
          </span>
          <span className="font-mono text-[11px] font-bold text-primary tracking-[0.05em]">LIVE</span>
        </div>
      </div>

      {pool.balance > 0 ? (
        <>
          {/* Big balance */}
          <AnimatedNumber
            value={pool.balance}
            className="font-display text-[32px] font-black tracking-[-0.02em] text-on-surface leading-none"
            suffix="SOL"
          />

          <div className="mb-3" />

          {/* Pool bar */}
          <div className="h-1 rounded-full bg-surface-lowest overflow-hidden mb-4">
            <div
              className="h-full rounded-full"
              style={{
                width: `${fillPct}%`,
                background: "linear-gradient(90deg, #1a3d2e, #34fea0)",
                transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </div>

          {/* Raid reward potential */}
          <div className="rounded-lg bg-surface-lowest p-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted mb-0.5">Max Raid Reward</p>
              <p className="font-mono text-[11px] text-on-surface-variant">Current Multiplier</p>
            </div>
            <span className="font-display text-[28px] font-black text-primary leading-none">
              {config.ticketPrice > 0 ? `${(pool.balance / config.ticketPrice).toFixed(1)}×` : "0×"}
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Pool building state — raider as background */}
          { }
          <img src="/images/ui/state_empty_pool.webp" alt="" className="absolute right-10 -top-2 w-[146px] h-[146px] object-contain pointer-events-none opacity-60 z-0" />
          <div className="mb-3">
            <span
              className="font-display text-[20px] font-black relative z-10"
              style={{ color: tierColor.main, animation: "poolPulse 2s ease-in-out infinite" }}
            >Pool Building</span>
          </div>

          {/* Progress bar to unlock */}
          <div className="rounded-lg bg-surface-lowest p-4 relative z-10">
            <div className="flex items-center justify-between mb-2">
              {pool.ticketCount >= 5 ? (
                <p className="font-mono text-[11px] font-bold" style={{ color: tierColor.main }}>Pool almost ready — next tickets could activate raids</p>
              ) : (
                <>
                  <p className="font-mono text-[11px] font-bold text-on-surface-variant">
                    A few more tickets to unlock raids
                  </p>
                  <span className="font-mono text-[11px] font-bold" style={{ color: tierColor.main }}>{pool.ticketCount}/6</span>
                </>
              )}
            </div>
            <div className="relative">
              <div className="h-2 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((pool.ticketCount / 6) * 100, 100)}%`,
                    background: `linear-gradient(90deg, ${tierColor.dark}, ${tierColor.main})`,
                  }}
                />
              </div>
              {/* Pulsing dot at the edge */}
              <span
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${Math.min((pool.ticketCount / 6) * 100, 100)}%`, marginLeft: -10 }}
              >
                <span className="block w-[10px] h-[10px] rounded-full" style={{ backgroundColor: tierColor.main, animation: "poolPulse 1.5s ease-in-out infinite", boxShadow: `0 0 6px ${tierColor.main}` }} />
              </span>
            </div>
            <p className="font-mono text-[10px] text-text-muted mt-2">
              Be an early player — the pool grows with every ticket sold. Once unlocked, you can raid up to 100% of it.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
