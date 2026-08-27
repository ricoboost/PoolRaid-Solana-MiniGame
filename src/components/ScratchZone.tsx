"use client";

import { useEffect, useRef } from "react";
import { ScratchCanvas } from "./ScratchCanvas";
import { formatLamports } from "@/lib/utils";
import { getTierColor } from "@/lib/tiers";
import { useSound } from "@/hooks/useSound";
import type { Tier, Zone1Result, Zone2Result, Zone3Result } from "@/types";

interface ScratchZoneProps {
  zone: 1 | 2 | 3;
  isRevealed: boolean;
  result: Zone1Result | Zone2Result | Zone3Result | null;
  onReveal: () => void;
  disabled: boolean;
  width: number;
  height: number;
  tier?: Tier;
}

const zoneLabels = ["INSTANT WIN", "POOL RAID", "BONUS"];

function getResultDisplay(zone: 1 | 2 | 3, result: Zone1Result | Zone2Result | Zone3Result) {
  if (zone === 1) {
    const r = result as Zone1Result;
    const hitWin = r.multiplier > 0;
    const gotPaid = BigInt(r.payoutLamports) > 0n;
    const isCapped = r.capped;

    if (hitWin && gotPaid && isCapped) {
      return { value: `+${formatLamports(r.payoutLamports)}`, sub: `Hit ${r.multiplier}\u00d7 \u2014 capped`, color: "text-primary", bg: "bg-gradient-to-b from-[#0a2a18] to-[#071f14]", raider: "/images/ui/raider_win_small.webp" };
    }
    if (hitWin && gotPaid) {
      const img = r.multiplier >= 3 ? "/images/ui/raider_win_big.webp" : "/images/ui/raider_win_small.webp";
      return { value: `+${formatLamports(r.payoutLamports)}`, sub: `${r.multiplier}\u00d7`, color: "text-primary", bg: "bg-gradient-to-b from-[#0a2a18] to-[#071f14]", raider: img };
    }
    if (hitWin && !gotPaid) {
      return { value: `${r.multiplier}\u00d7`, sub: "Pool empty", color: "text-tertiary", bg: "bg-gradient-to-b from-[#1f1a08] to-[#15120a]", raider: "/images/ui/raider_shocked.webp" };
    }
    return { value: "Not This Time", sub: "", color: "text-text-ghost", bg: "bg-gradient-to-b from-[#151822] to-[#0e1018]", raider: "/images/ui/raider_lose.webp" };
  }
  if (zone === 2) {
    const r = result as Zone2Result;
    const isWin = BigInt(r.payoutLamports) > 0n;
    if (isWin) {
      const img = r.poolPct >= 1.0 ? "/images/zones/raider_drain.webp" : "/images/ui/raider_win_big.webp";
      return { value: `+${formatLamports(r.payoutLamports)}`, sub: r.label, color: "text-secondary", bg: "bg-gradient-to-b from-[#1a0f2a] to-[#120a1f]", raider: img };
    }
    return { value: "Almost!", sub: "", color: "text-text-ghost", bg: "bg-gradient-to-b from-[#151822] to-[#0e1018]", raider: "/images/ui/raider_default.webp" };
  }
  const r = result as Zone3Result;
  const isWin = r.type !== "nothing";
  if (isWin) {
    return { value: "FREE", sub: r.label, color: "text-tertiary", bg: "bg-gradient-to-b from-[#1f1a08] to-[#15120a]", raider: "/images/ui/raider_win_small.webp" };
  }
  return { value: "So Close!", sub: "", color: "text-text-ghost", bg: "bg-gradient-to-b from-[#151822] to-[#0e1018]", raider: "/images/ui/raider_default.webp" };
}

export function ScratchZone({ zone, isRevealed, result, onReveal, disabled, width, height, tier = "micro" }: ScratchZoneProps) {
  const { play } = useSound();
  const playedRef = useRef(false);

  // Play zone-specific sound on reveal
  useEffect(() => {
    if (!isRevealed || playedRef.current || !result) return;
    playedRef.current = true;

    if (zone === 1) {
      const r = result as Zone1Result;
      if (r.multiplier === 0) play("zone_nothing");
      else if (r.multiplier <= 0.5) play("zone_small");
      else if (r.multiplier <= 2) play("zone_win");
      else if (r.multiplier <= 3) play("zone_big");
      else play("zone_jackpot");
    } else if (zone === 2) {
      const r = result as Zone2Result;
      if (BigInt(r.payoutLamports) <= 0n) play("raid_miss");
      else if (r.poolPct >= 0.5) play("raid_drain");
      else play("raid_hit");
    } else {
      const r = result as Zone3Result;
      if (r.type === "free_up") play("free_ticket_up");
      else if (r.type === "free_same") play("free_ticket");
    }
  }, [isRevealed, zone, result, play]);

  if (!result) return null;

  const display = getResultDisplay(zone, result);
  const tierColor = getTierColor(tier);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
        {zoneLabels[zone - 1]}
      </span>
      <div
        className="rounded-xl overflow-hidden"
        style={{ width, height, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)" }}
      >
        <ScratchCanvas width={width} height={height} onReveal={onReveal} disabled={disabled}>
          <div
            className={`w-full h-full flex flex-col items-center pt-[20%] gap-0.5 px-1 ${display.bg}`}
            style={{
              backgroundImage: `url(${display.raider})`,
              backgroundPosition: "center 90%",
              backgroundSize: "75% auto",
              backgroundRepeat: "no-repeat",
              ...(isRevealed ? { animation: "zoneReveal 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards" } : {}),
            }}
          >
            <span className={`font-display text-[18px] font-black ${display.color} leading-tight text-center`}>
              {display.value}
            </span>
            {display.sub && (
              <span
                className="font-display text-[28px] font-black text-center leading-none"
                style={{
                  background: `linear-gradient(90deg, ${tierColor.main}, #ffffff, ${tierColor.main})`,
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  animation: "poolBarGlow 2s linear infinite",
                }}
              >
                {display.sub}
              </span>
            )}
          </div>
        </ScratchCanvas>
      </div>
    </div>
  );
}
