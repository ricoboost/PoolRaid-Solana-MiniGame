"use client";

import { TIERS } from "@/lib/tiers";
import { formatSOL } from "@/lib/utils";
import type { Tier, PoolData } from "@/types";

interface TierSelectorProps {
  selectedTier: Tier;
  onSelect: (tier: Tier) => void;
  pools: PoolData[];
}

export function TierSelector({ selectedTier, onSelect, pools }: TierSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 mb-4">
      {TIERS.map((t) => {
        const pool = pools.find((p) => p.tier === t.tier);
        const isSelected = t.tier === selectedTier;

        return (
          <button
            key={t.tier}
            onClick={() => onSelect(t.tier)}
            className={`relative flex flex-col items-center gap-0.5 py-2 px-1.5 rounded-xl border transition-all duration-[250ms] cursor-pointer overflow-hidden ${
              isSelected
                ? "border-gold-primary/40 -translate-y-px"
                : "border-[--border-faint] hover:border-[--border-subtle] hover:bg-bg-hover/50"
            }`}
            style={
              isSelected
                ? {
                    background: "linear-gradient(160deg, #12161f 0%, #0d1017 100%)",
                    boxShadow: "0 0 20px rgba(212,166,66,0.08), inset 0 1px 0 rgba(212,166,66,0.1)",
                  }
                : { background: "#0d1017" }
            }
          >
            {isSelected && (
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top, rgba(212,166,66,0.05) 0%, transparent 60%)" }} />
            )}
            <span
              className={`text-base relative z-10 transition-all duration-200 ${!isSelected ? "grayscale-[0.5] brightness-75 saturate-50" : ""}`}
            >
              {t.emoji}
            </span>
            <span
              className={`font-display text-[10px] font-bold relative z-10 ${
                isSelected ? "text-gold-bright" : "text-text-primary"
              }`}
            >
              {t.label}
            </span>
            <span className="font-mono text-[9px] font-semibold text-text-secondary relative z-10">
              {t.ticketPrice} SOL
            </span>
            {pool && pool.balance > 0 && (
              <span className="font-mono text-[8px] text-text-muted relative z-10">
                {formatSOL(pool.balance)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
