"use client";

import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGameState } from "@/hooks/useGameState";
import { useSound } from "@/hooks/useSound";
import { usePools } from "@/hooks/usePools";
import { useFreeTickets } from "@/hooks/useFreeTickets";
import { Sidebar, MobileTierStrip } from "./Sidebar";
import { PoolDisplay } from "./PoolDisplay";
import { ScratchCard } from "./ScratchCard";
import { WinResult } from "./WinResult";
import { BuyButton } from "./BuyButton";
import { LiveFeed } from "./LiveFeed";
import { formatSOL } from "@/lib/utils";
import { getTierGradient, getTierGlow } from "@/lib/tiers";
import type { Tier } from "@/types";
import { useWalletSession } from "@/hooks/useWalletSession";

export default function GameFlow() {
  const [selectedTier, setSelectedTierRaw] = useState<Tier>("micro");
  const setSelectedTier = (tier: Tier) => {
    if (tier !== selectedTier) {
      reset();
      setTicketKey((k) => k + 1);
    }
    setSelectedTierRaw(tier);
  };
  const [ticketKey, setTicketKey] = useState(0);
  const { state, buyTicket, playFreeTicket, claimPayout, revealZone, reset, clearError } = useGameState();
  const { freeTickets, refresh: refreshFreeTickets } = useFreeTickets();
  const { pools, pause, resume } = usePools();
  const { connected, publicKey } = useWallet();
  const prevPhase = useRef(state.phase);
  const { play } = useSound();
  const [achievementToast, setAchievementToast] = useState<{ name: string; icon: string } | null>(null);
  const declaredRef = useRef(false);
  const { ensureSession } = useWalletSession();

  // Silent declaration logging
  useEffect(() => {
    if (connected && publicKey && !declaredRef.current) {
      declaredRef.current = true;
      ensureSession().then(() => fetch("/api/declaration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })).catch(() => {});
    }
  }, [connected, publicKey, ensureSession]);

  // Session time reminder
  const sessionStartRef = useRef<number | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  const lastReminderRef = useRef(0);

  useEffect(() => {
    if (state.session.tickets > 0 && !sessionStartRef.current) {
      sessionStartRef.current = Date.now();
    }
  }, [state.session.tickets]);

  useEffect(() => {
    if (!sessionStartRef.current) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionStartRef.current!;
      const mins = elapsed / 60_000;
      if (mins >= 60 && Date.now() - lastReminderRef.current > 30 * 60_000) {
        setShowReminder(true);
        lastReminderRef.current = Date.now();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Pool polling control
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = state.phase;

    if (state.phase === "scratching" && prev !== "scratching") {
      setTicketKey((k) => k + 1);
      pause();
    }
    if ((state.phase === "claimed" || state.phase === "idle") &&
        (prev === "scratching" || prev === "revealed" || prev === "claiming" || prev === "claimed")) {
      resume();
      refreshFreeTickets(); // Refresh free ticket count after game
    }
    if (state.phase === "revealed" && prev === "scratching" && BigInt(state.result?.totalPayoutLamports ?? "0") === 0n) {
      resume();
      refreshFreeTickets();
    }
  }, [state.phase, state.result, pause, resume, refreshFreeTickets]);

  // Achievement toast — only after all zones revealed
  useEffect(() => {
    if (state.phase === "revealed" && state.result?.newAchievements && state.result.newAchievements.length > 0) {
      const first = state.result.newAchievements[0];
      const timer = setTimeout(() => {
        setAchievementToast(first);
        setTimeout(() => setAchievementToast(null), 4000);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.result]);

  // Sound effects on phase changes
  useEffect(() => {
    if (state.phase === "revealed") {
      play("all_revealed");
      if (state.result && BigInt(state.result.totalPayoutLamports) > 0n) {
        setTimeout(() => play("win_result"), 300);
      } else {
        setTimeout(() => play("no_win"), 300);
      }
    }
    if (state.phase === "claimed") {
      play("payout_sent");
    }
  }, [state.phase, state.result, play]);

  // Achievement sound
  useEffect(() => {
    if (achievementToast) play("achievement");
  }, [achievementToast, play]);

  // Error sound
  useEffect(() => {
    if (state.error) play("error");
  }, [state.error, play]);

  // Auto-claim: trigger payout automatically when all zones revealed and there's a win
  useEffect(() => {
    if (state.phase === "revealed" && state.result && BigInt(state.result.totalPayoutLamports) > 0n) {
      const timer = setTimeout(() => claimPayout(), 500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.result, claimPayout]);

  const showScratchCard =
    state.phase === "scratching" ||
    state.phase === "revealed" ||
    state.phase === "claiming" ||
    state.phase === "claimed";

  const showSession = connected && state.session.tickets > 0;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Desktop Sidebar */}
      <Sidebar selectedTier={selectedTier} onSelect={setSelectedTier} pools={pools} />

      {/* Mobile Tier Strip */}
      <div className="lg:hidden fixed top-14 left-0 right-0 z-40">
        <MobileTierStrip selectedTier={selectedTier} onSelect={setSelectedTier} pools={pools} />
      </div>

      {/* Main Content — two-column on desktop */}
      <main className="flex-1 px-4 lg:px-6 pt-16 lg:pt-6 pb-8 w-full max-w-[1100px] mx-auto">
        <div className="lg:flex lg:gap-6">
          {/* LEFT COLUMN — Scratch card + result details */}
          <div className="lg:flex-1 lg:min-w-0">
            {/* Mobile only: pool display + buy button on top */}
            <div className="lg:hidden">
              <PoolDisplay tier={selectedTier} pools={pools} />
              <BuyButton
                tier={selectedTier}
                phase={state.phase}
                onBuy={() => buyTicket(selectedTier)}
                onPlayFree={playFreeTicket}
                freeTicketTier={state.freeTicketTier}
                availableFreeTickets={freeTickets}
              />
              <div className="h-3" />
            </div>

            {state.error && (
              <div className="mb-3 p-3 rounded-lg bg-lose/[0.06]">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[13px] text-lose">{state.error}</p>
                  <button onClick={clearError} className="font-mono text-[13px] text-text-muted hover:text-on-surface cursor-pointer ml-2">&times;</button>
                </div>
              </div>
            )}

            {/* Scratch card — always visible */}
            {showScratchCard ? (
              <>
                <ScratchCard
                  key={ticketKey}
                  seedHash={state.seedHash}
                  zonesRevealed={state.zonesRevealed}
                  result={state.result}
                  onRevealZone={revealZone}
                  disabled={state.phase !== "scratching"}
                  tier={selectedTier}
                />
                {(state.phase === "revealed" || state.phase === "claiming" || state.phase === "claimed") &&
                  state.result &&
                  state.ticketId && (
                    <WinResult
                      result={state.result}
                      ticketId={state.ticketId}
                      payoutTx={state.payoutTx}
                      phase={state.phase}
                      onClaim={claimPayout}
                    />
                  )}
              </>
            ) : (
              <EmptyScratchCard loading={["buying", "sending", "confirming"].includes(state.phase)} tier={selectedTier} />
            )}

            {/* Session stats */}
            {showSession && (
              <div className="flex items-center justify-center gap-4 mb-3 py-2 px-3 rounded-lg bg-surface-container/50">
                <span className="font-mono text-[12px] text-text-muted">{state.session.tickets} played</span>
                <span className="w-px h-3 bg-surface-bright" />
                <span className="font-mono text-[12px] text-text-muted">{formatSOL(state.session.wagered)} wagered</span>
                <span className="w-px h-3 bg-surface-bright" />
                <span className={`font-mono text-[12px] font-semibold ${state.session.won >= state.session.wagered ? "text-win" : "text-text-muted"}`}>
                  {formatSOL(state.session.won)} won
                </span>
                {state.result?.currentStreak !== undefined && state.result.currentStreak > 0 && (
                  <>
                    <span className="w-px h-3 bg-surface-bright" />
                    <span className="font-mono text-[12px] font-bold text-primary">{"\u{1F525}"} {state.result.currentStreak}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — Buy button (top) + Pool details + live feed */}
          <div className="lg:w-[340px] lg:flex-shrink-0">
            {/* Desktop only: buy button on top of right column */}
            <div className="hidden lg:block mb-4">
              <BuyButton
                tier={selectedTier}
                phase={state.phase}
                onBuy={() => buyTicket(selectedTier)}
                onPlayFree={playFreeTicket}
                freeTicketTier={state.freeTicketTier}
                availableFreeTickets={freeTickets}
              />
            </div>
            {/* Desktop only: pool display */}
            <div className="hidden lg:block">
              <PoolDisplay tier={selectedTier} pools={pools} />
            </div>
            <LiveFeed />
          </div>
        </div>

        {/* Inline footer — fixed bottom right, hidden on mobile (bottom nav replaces it) */}
        <div className="hidden md:flex fixed bottom-5 right-6 z-30 flex-wrap items-center justify-end gap-x-2 gap-y-1">
          { }
          <img src="/images/ui/miniIconRaccoon.png" alt="" width={14} height={14} className="rounded-sm" />
          <span className="font-display text-[9px] font-bold text-text-muted">PoolRaid</span>
          <span className="text-text-ghost text-[8px]">&middot;</span>
          <span className="px-1.5 py-px rounded text-[8px] font-mono font-bold bg-surface-bright/60 text-text-muted">18+</span>
          <span className="text-text-ghost text-[8px]">&middot;</span>
          <a href="/terms" className="font-mono text-[8px] text-text-ghost hover:text-primary transition-colors">Terms</a>
          <span className="text-text-ghost text-[8px]">&middot;</span>
          <a href="/privacy" className="font-mono text-[8px] text-text-ghost hover:text-primary transition-colors">Privacy</a>
          <span className="text-text-ghost text-[8px]">&middot;</span>
          <a href="/responsible-gaming" className="font-mono text-[8px] text-text-ghost hover:text-primary transition-colors">Play Responsibly</a>
          <span className="text-text-ghost text-[8px]">&middot;</span>
          <a href="/rules" className="font-mono text-[8px] text-text-ghost hover:text-primary transition-colors">Provably Fair</a>
          <span className="text-text-ghost text-[8px]">&middot;</span>
          <span className="font-mono text-[7px] text-text-ghost">&copy; 2026</span>
        </div>
      </main>

      {/* Achievement toast */}
      {achievementToast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl max-w-[360px] glass"
          style={{ boxShadow: "0 8px 32px var(--glow-primary)", animation: "slideReveal 0.4s ease forwards" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{achievementToast.icon}</span>
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted">Achievement Unlocked</p>
              <p className="font-display text-sm font-bold text-primary">{achievementToast.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Session reminder */}
      {showReminder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-surface/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-[380px] rounded-xl p-5 glass text-center">
            <p className="font-display text-base font-bold text-on-surface mb-3">You&apos;ve been playing for a while</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <MiniStat label="Tickets" value={String(state.session.tickets)} />
              <MiniStat label="Wagered" value={`${formatSOL(state.session.wagered)} SOL`} />
              <MiniStat label="Won" value={`${formatSOL(state.session.won)} SOL`} color="text-win" />
              <MiniStat label="Net" value={`${state.session.won >= state.session.wagered ? "+" : ""}${formatSOL(state.session.won - state.session.wagered)} SOL`} color={state.session.won >= state.session.wagered ? "text-win" : "text-lose"} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowReminder(false)} className="flex-1 py-2.5 rounded-lg font-display text-[11px] font-bold text-on-surface bg-surface-bright/50 cursor-pointer">Continue</button>
              <a href="/responsible-gaming" className="flex-1 py-2.5 rounded-lg font-display text-[11px] font-bold text-primary bg-primary-container/30 cursor-pointer text-center">Take a Break</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-surface-lowest/50 p-2">
      <p className="font-mono text-[11px] text-text-muted uppercase">{label}</p>
      <p className={`font-display text-sm font-bold ${color || "text-on-surface"}`}>{value}</p>
    </div>
  );
}

function EmptyScratchCard({ loading, tier }: { loading: boolean; tier: Tier }) {
  const gradient = getTierGradient(tier);
  const glow = getTierGlow(tier);

  return (
    <section className="mb-5">
      {/* Metallic border frame */}
      <div
        className="p-[2px] rounded-xl"
        style={{
          background: gradient,
          boxShadow: `0 0 24px ${glow}, 0 8px 24px rgba(0,0,0,0.3)`,
          animation: "metalSpin 4s linear infinite",
        }}
      >
        <div className="rounded-[14px] bg-surface-container p-4 relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
                Provably Fair
              </span>
            </div>
            <span className="font-display text-[16px] font-black text-on-surface tracking-[-0.01em]">
              SCRATCH & WIN
            </span>
          </div>

          {/* 3 empty scratch zones — silver metallic surfaces */}
          <div className="flex gap-2 mb-4">
            {["INSTANT WIN", "POOL RAID", "BONUS"].map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                  {label}
                </span>
                <div
                  className="w-full aspect-[1/1.25] rounded-xl relative overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, #1a1f2e, #222838 50%, #1a1f2e)",
                  }}
                >
                  {/* Dot pattern */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: "radial-gradient(circle at 6px 6px, rgba(52,254,160,0.03) 0.8px, transparent 0)",
                    backgroundSize: "12px 12px",
                  }} />

                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary/50 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* SCRATCH text */}
                      <span className="absolute inset-0 flex items-center justify-center -mt-[40%] font-display text-[13px] font-black text-primary/10 uppercase tracking-[0.15em] z-20">
                        SCRATCH
                      </span>
                      {/* Raider — oversized, bottom-anchored */}
                      { }
                      <img
                        src="/images/ui/raider_default.webp"
                        alt=""
                        className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[110%] h-auto opacity-15 object-contain z-10"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-2">
            <p className="font-mono text-[11px] text-on-surface-variant text-center">
              {loading ? "Preparing your ticket..." : "Buy a ticket to start scratching"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
