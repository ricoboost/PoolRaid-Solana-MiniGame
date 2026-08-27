"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatedNumber } from "./AnimatedNumber";
import { UserCard } from "./UserCard";
import { TIERS } from "@/lib/tiers";
import { formatSOL } from "@/lib/utils";
import type { Tier, PoolData } from "@/types";

interface SidebarProps {
  selectedTier: Tier;
  onSelect: (tier: Tier) => void;
  pools: PoolData[];
}

export function Sidebar({ selectedTier, onSelect, pools }: SidebarProps) {
  const totalPool = pools.reduce((sum, p) => sum + (p.rawBalance ?? p.balance), 0);

  return (
    <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-3.5rem)] sticky top-14 bg-surface-low overflow-y-auto">
      {/* Total Pool card */}
      <div className="m-3 mb-2 p-4 rounded-xl border border-surface-bright/30 bg-surface-high">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary/60 mb-1.5">
          Total Prize Pools
        </p>
        <AnimatedNumber
          value={totalPool}
          className="font-display text-[26px] font-black tracking-[-0.03em] text-on-surface leading-none"
          suffix="SOL"
          format={(n) => n.toFixed(3)}
        />
        <div className="flex items-center gap-1.5 mt-2">
          <span className="relative w-[5px] h-[5px]">
            <span className="absolute inset-0 rounded-full bg-primary animate-[livePulse_2s_ease-in-out_infinite]" />
            <span className="absolute inset-0 rounded-full bg-primary animate-[ping_2s_ease-in-out_infinite]" />
          </span>
          <span className="font-mono text-[9px] font-bold text-primary tracking-[0.05em]">LIVE</span>
        </div>
      </div>

      {/* Tier selector */}
      <div className="flex-1 px-2 pb-2">
        <p className="px-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted mb-2">
          Select Tier
        </p>
        <div className="space-y-1">
          {(() => {
            // Show unlocked tiers + only the first locked tier as teaser
            let firstLockedShown = false;
            return TIERS.filter((t) => {
              const pool = pools.find((p) => p.tier === t.tier);
              if (!pool || !pool.isActive) return false;
              if (pool.isLocked) {
                if (firstLockedShown) return false;
                firstLockedShown = true;
                return true;
              }
              return true;
            });
          })().map((t) => {
            const pool = pools.find((p) => p.tier === t.tier);
            const isSelected = t.tier === selectedTier;
            const balance = pool?.balance ?? 0;
            const locked = pool?.isLocked ?? false;

            if (locked) {
              return (
                <div
                  key={t.tier}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-60 cursor-not-allowed"
                >
                  <Image
                    src={`/images/tiers/${t.tier}_coin.webp`}
                    alt={t.label}
                    width={30}
                    height={30}
                    className="rounded-lg grayscale"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-display text-[12px] font-bold text-text-muted">{t.label}</p>
                    <p className="font-mono text-[10px] text-primary">Coming soon</p>
                  </div>
                  <span className="font-mono text-[10px] text-text-ghost">{t.ticketPrice} SOL</span>
                </div>
              );
            }

            return (
              <button
                key={t.tier}
                onClick={() => onSelect(t.tier)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-primary-container/60"
                    : "hover:bg-surface-bright/50"
                }`}
                style={
                  isSelected
                    ? { boxShadow: "0 0 24px var(--glow-primary), inset 0 0 20px rgba(52,254,160,0.03)" }
                    : undefined
                }
              >
                <Image
                  src={`/images/tiers/${t.tier}_coin.webp`}
                  alt={t.label}
                  width={30}
                  height={30}
                  className={`rounded-lg transition-all ${!isSelected ? "opacity-60" : ""}`}
                />
                <div className="flex-1 text-left">
                  <p className={`font-display text-[12px] font-bold ${isSelected ? "text-primary" : "text-on-surface-variant"}`}>
                    {t.label}
                  </p>
                  <p className="font-mono text-[12px] text-text-muted">
                    {t.ticketPrice} SOL
                  </p>
                </div>
                {balance > 0 && (
                  <span className={`font-mono text-[12px] font-semibold ${isSelected ? "text-primary/70" : "text-text-muted"}`}>
                    {formatSOL(balance)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Coin Flip PVP CTA */}
      <div className="px-2 pb-2">
        <a
          href="/flip"
          className="block rounded-xl p-3.5 transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #34fea0 0%, #28d888 50%, #1fbf72 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <SidebarCoinFlip />
            <div className="flex-1 min-w-0">
              <p className="font-display text-[13px] font-black text-on-primary leading-tight">
                Coin Flip
              </p>
              <p className="font-mono text-[9px] font-bold text-on-primary/60 uppercase tracking-[0.1em]">
                PVP &middot; 50/50 &middot; 2x
              </p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-on-primary/70 flex-shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </a>
      </div>

      {/* User card */}
      <UserCard />
    </aside>
  );
}

/**
 * Mobile tier strip — horizontal scroll, shown below TopBar on small screens
 */
export function MobileTierStrip({ selectedTier, onSelect, pools }: SidebarProps) {
  return (
    <div className="lg:hidden flex gap-1.5 overflow-x-auto px-4 py-2.5 bg-surface-low no-scrollbar">
      {TIERS.filter((t) => {
        const pool = pools.find((p) => p.tier === t.tier);
        return (!pool || pool.isActive) && !pool?.isLocked;
      }).map((t) => {
        const isSelected = t.tier === selectedTier;

        return (
          <button
            key={t.tier}
            onClick={() => onSelect(t.tier)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
              isSelected
                ? "bg-primary-container/60"
                : "bg-surface-container hover:bg-surface-bright/50"
            }`}
          >
            <Image
              src={`/images/tiers/${t.tier}_coin.webp`}
              alt={t.label}
              width={24}
              height={24}
              className={`rounded-md ${!isSelected ? "opacity-60" : ""}`}
            />
            <div className="text-left">
              <p className={`font-display text-[13px] font-bold ${isSelected ? "text-primary" : "text-on-surface-variant"}`}>
                {t.label}
              </p>
              <p className="font-mono text-[11px] text-text-muted">{t.ticketPrice} SOL</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SidebarCoinFlip() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => prev + 180);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-shrink-0" style={{ perspective: "400px" }}>
      <div
        className="relative w-11 h-11"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
          transform: `rotateY(${rotation}deg)`,
        }}
      >
        {/* Heads face */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            boxShadow: "0 2px 6px rgba(0,0,0,0.5), 0 0 0 2px rgba(192,188,180,0.4), inset 0 1px 2px rgba(255,255,255,0.2)",
          }}
        >
          { }
          <img src="/images/ui/coin_head.webp" alt="" className="w-full h-full object-cover" />
        </div>
        {/* Tails face */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.5), 0 0 0 2px rgba(192,188,180,0.4), inset 0 1px 2px rgba(255,255,255,0.2)",
          }}
        >
          { }
          <img src="/images/ui/coin_tail.webp" alt="" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}

