"use client";

import { useEffect, useRef } from "react";
import { formatLamports } from "@/lib/utils";
import { WinParticles } from "./WinParticles";
import { getLevelForXp } from "@/lib/xp";
import { useSound } from "@/hooks/useSound";
import type { ScratchResult } from "@/types";
import type { GamePhase } from "@/hooks/useGameState";

interface WinResultProps {
  result: ScratchResult;
  ticketId: string;
  payoutTx: string | null;
  phase: GamePhase;
  onClaim: () => void;
}

export function WinResult({ result, ticketId, payoutTx, phase }: WinResultProps) {
  const { play } = useSound();
  const streakPlayedRef = useRef(false);

  useEffect(() => {
    if (!streakPlayedRef.current && result.currentStreak && result.currentStreak > 1) {
      streakPlayedRef.current = true;
      play("streak");
    }
  }, [result.currentStreak, play]);
  const isWin = BigInt(result.totalPayoutLamports) > 0n;
  const isBigWin = BigInt(result.totalPayoutLamports) >= 500_000_000n;
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  const explorerSuffix = network === "mainnet-beta" ? "" : `?cluster=${network}`;
  const hitWinButEmpty = !isWin && result.zone1.multiplier > 0 && result.zone1.capped;
  const isClaiming = phase === "claiming";
  const isClaimed = phase === "claimed";
  const streak = result.currentStreak ?? 0;
  const xpGained = result.xpGained ?? 0;
  const levelDef = result.totalXp !== undefined ? getLevelForXp(result.totalXp) : null;

  if (!isWin) {
    return (
      <div className="text-center py-5 mb-4" style={{ animation: "slideReveal 0.5s ease forwards" }}>
        {hitWinButEmpty && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-tertiary-container/20 inline-block">
            <p className="font-mono text-[12px] text-tertiary">You hit {result.zone1.multiplier}&times; ({formatLamports(result.zone1.rawPayoutLamports)} SOL) but the pool was empty</p>
          </div>
        )}
        {result.freeTicketId ? (
          <>
            <p className="font-display text-base font-bold text-tertiary">{"\u{1F39F}\uFE0F"} Free Ticket Won!</p>
            <p className="font-mono text-[12px] text-on-surface-variant mt-1">You earned a free {result.freeTicketTier} ticket</p>
          </>
        ) : (
          <p className="font-display text-base font-bold text-text-muted">{hitWinButEmpty ? "Unlucky \u2014 pool was empty" : "Better luck next time"}</p>
        )}
        {xpGained > 0 && <p className="font-mono text-[12px] text-secondary mt-2">+{xpGained} XP</p>}
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl p-5 text-center mb-4 overflow-hidden bg-surface-container"
      style={{ animation: "slideReveal 0.5s ease forwards" }}
    >
      {isClaimed && <WinParticles count={isBigWin ? 32 : 18} color={isBigWin ? "green" : "gold"} />}

      <p className="font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-primary mb-1 relative z-10">You Won</p>
      <p className="font-display text-[48px] font-black text-on-surface leading-none relative z-10 tracking-[-0.03em]">
        {formatLamports(result.totalPayoutLamports)}<span className="text-primary text-lg ml-1.5">SOL</span>
      </p>

      <div className="flex items-center justify-center gap-3 mt-2 relative z-10">
        {streak > 1 && <span className="font-mono text-[12px] font-bold text-tertiary">{"\u{1F525}"} {streak} streak</span>}
        {xpGained > 0 && <span className="font-mono text-[12px] font-semibold text-secondary">+{xpGained} XP</span>}
        {levelDef && <span className="font-mono text-[12px] text-on-surface-variant">Lv.{levelDef.level} {levelDef.name}</span>}
      </div>

      {result.freeTicketId && (
        <div className="mt-3 px-3 py-1.5 rounded-lg bg-tertiary-container/30 relative z-10">
          <p className="font-mono text-[12px] font-bold text-tertiary">{"\u{1F39F}\uFE0F"} Free {result.freeTicketTier} ticket earned!</p>
        </div>
      )}

      {/* Auto-claiming spinner */}
      {(phase === "revealed" || isClaiming) && (
        <div className="mt-4 flex items-center justify-center gap-2 relative z-10">
          <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="font-mono text-[12px] text-text-muted">Sending to wallet...</span>
        </div>
      )}

      {/* 3-button row after claimed */}
      {isClaimed && (
        <div className="mt-4 flex items-center gap-2 relative z-10">
          <a
            href={`/verify/${ticketId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-lg font-mono text-[11px] font-bold text-on-surface-variant bg-surface-bright/50 hover:bg-surface-bright/70 transition-all text-center"
          >
            Verify
          </a>
          {payoutTx && (
            <a
            href={`https://explorer.solana.com/tx/${payoutTx}${explorerSuffix}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-lg font-mono text-[11px] font-bold text-on-surface-variant bg-surface-bright/50 hover:bg-surface-bright/70 transition-all text-center"
            >
              View TX
            </a>
          )}
          <button
            onClick={() => {
              const url = `${window.location.origin}/verify/${ticketId}`;
              const text = `Just won ${formatLamports(result.totalPayoutLamports)} SOL on PoolRaid! ${result.zone1.multiplier > 0 ? result.zone1.multiplier + "x hit" : "Pool raid"} \u{1F3B0}\n${url}`;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
            }}
            className="flex-1 py-2.5 rounded-lg font-mono text-[11px] font-bold text-primary bg-primary/[0.08] hover:bg-primary/[0.14] transition-all cursor-pointer text-center"
          >
            Share
          </button>
        </div>
      )}
    </div>
  );
}
