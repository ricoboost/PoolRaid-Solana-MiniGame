"use client";

import { FLIP_TIERS, type FlipTier } from "@/lib/flip/flipTiers";
import { formatSOL } from "@/lib/utils";

interface Props {
  selectedTier: FlipTier;
  onSelect: (tier: FlipTier) => void;
  roomCounts?: Record<number, number>; // tier → number of active rooms
}

export function FlipTierTabs({ selectedTier, onSelect, roomCounts }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2 -mx-1 px-1">
      {FLIP_TIERS.map((tier) => {
        const isActive = selectedTier === tier;
        const activeCount = roomCounts?.[tier] ?? 0;

        return (
          <button
            key={tier}
            onClick={() => onSelect(tier)}
            className={`relative flex-shrink-0 px-3 md:px-3.5 py-1.5 md:py-2 rounded-lg font-mono text-[11px] md:text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-bright/60"
            }`}
          >
            {formatSOL(tier)} SOL
            {activeCount > 0 && !isActive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-[livePulse_2s_ease-in-out_infinite]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
