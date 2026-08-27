"use client";

import { useRef, useEffect, useState } from "react";
import { ScratchZone } from "./ScratchZone";
import { getTierGradient, getTierGlow } from "@/lib/tiers";
import type { Tier, ScratchResult } from "@/types";

interface ScratchCardProps {
  seedHash: string | null;
  zonesRevealed: [boolean, boolean, boolean];
  result: ScratchResult | null;
  onRevealZone: (zone: 0 | 1 | 2) => void;
  disabled: boolean;
  tier?: Tier;
}

export function ScratchCard({ seedHash, zonesRevealed, result, onRevealZone, disabled, tier = "micro" }: ScratchCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoneSize, setZoneSize] = useState({ w: 100, h: 120 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerW = entry.contentRect.width;
        const gap = 8;
        const zw = Math.floor((containerW - gap * 2) / 3);
        const zh = Math.floor(zw * 1.25);
        setZoneSize({ w: zw, h: zh });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const gradient = getTierGradient(tier);
  const glow = getTierGlow(tier);

  return (
    <section className="mb-5">
      {/* Metallic border frame */}
      <div
        className="p-[2px] rounded-xl"
        style={{
          background: gradient,
          boxShadow: `0 0 30px ${glow}, 0 8px 32px rgba(0,0,0,0.4)`,
          animation: "metalSpin 4s linear infinite",
        }}
      >
        <div className="rounded-[14px] bg-surface-container p-4 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="relative w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-primary" />
                <span className="absolute inset-0 rounded-full bg-primary animate-[ping_2s_ease-in-out_infinite]" />
              </span>
              <a href="/rules" className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted hover:text-primary transition-colors">
                Provably Fair &rarr;
              </a>
            </div>
            <span className="font-display text-[16px] font-black text-on-surface tracking-[-0.01em]">
              SCRATCH & WIN
            </span>
          </div>

          {/* 3 Scratch Zones */}
          <div ref={containerRef} className="flex gap-2 mb-4 relative z-10">
            <ScratchZone zone={1} isRevealed={zonesRevealed[0]} result={result?.zone1 ?? null} onReveal={() => onRevealZone(0)} disabled={disabled} width={zoneSize.w} height={zoneSize.h} tier={tier} />
            <ScratchZone zone={2} isRevealed={zonesRevealed[1]} result={result?.zone2 ?? null} onReveal={() => onRevealZone(1)} disabled={disabled} width={zoneSize.w} height={zoneSize.h} tier={tier} />
            <ScratchZone zone={3} isRevealed={zonesRevealed[2]} result={result?.zone3 ?? null} onReveal={() => onRevealZone(2)} disabled={disabled} width={zoneSize.w} height={zoneSize.h} tier={tier} />
          </div>

          {/* Seed hash footer */}
          {seedHash && (
            <div className="pt-2.5 relative z-10">
              <p className="font-mono text-[10px] text-text-ghost truncate leading-relaxed">
                <span className="text-text-muted">hash:</span> {seedHash}
              </p>
              {result?.seed && (
                <p className="font-mono text-[10px] text-text-ghost truncate leading-relaxed">
                  <span className="text-text-muted">seed:</span> {result.seed}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
