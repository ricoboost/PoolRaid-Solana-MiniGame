"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getTierConfig } from "@/lib/tiers";
import type { Tier } from "@/types";
import type { GamePhase } from "@/hooks/useGameState";
import type { FreeTicket } from "@/hooks/useFreeTickets";

interface BuyButtonProps {
  tier: Tier;
  phase: GamePhase;
  onBuy: () => void;
  onPlayFree?: (ticketId?: string) => void;
  freeTicketTier?: string | null;
  availableFreeTickets?: FreeTicket[];
}

const primaryStyle = {
  background: "linear-gradient(135deg, #2be88e 0%, #34fea0 50%, #2be88e 100%)",
  boxShadow: "0 4px 20px var(--glow-primary-strong)",
};

function Dot() {
  return <span className="w-1 h-1 rounded-full bg-current opacity-60" />;
}

export function BuyButton({ tier, phase, onBuy, onPlayFree, freeTicketTier, availableFreeTickets = [] }: BuyButtonProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const config = getTierConfig(tier);

  // Filter free tickets for the currently selected tier
  const tierFreeTickets = availableFreeTickets.filter((t) => t.tier === tier);
  const tierFreeCount = tierFreeTickets.length;

  if (phase === "claiming") return null;

  if (phase === "revealed" || phase === "claimed") {
    const hasSessionFree = !!freeTicketTier;

    return (
      <div className="flex flex-col gap-2">
        {hasSessionFree && (
          <button onClick={() => onPlayFree?.()} className="w-full py-3.5 rounded-lg font-display text-[13px] font-extrabold uppercase tracking-[0.08em] text-on-primary hover:brightness-110 transition-all cursor-pointer" style={primaryStyle}>
            <span className="flex items-center justify-center gap-2">Replay for Free <Dot /> {freeTicketTier} tier</span>
          </button>
        )}
        <button
          onClick={onBuy}
          className={`w-full py-3.5 rounded-lg font-display text-[13px] font-extrabold uppercase tracking-[0.08em] hover:brightness-110 transition-all cursor-pointer ${hasSessionFree ? "bg-surface-bright/50 text-on-surface" : "text-on-primary"}`}
          style={hasSessionFree ? undefined : primaryStyle}
        >
          <span className="flex items-center justify-center gap-2">{hasSessionFree ? "Buy New Ticket" : "Play Again"} <Dot /> {config.ticketPrice} SOL</span>
        </button>
        {!hasSessionFree && tierFreeCount > 0 && (
          <button
            onClick={() => onPlayFree?.(tierFreeTickets[0]?.id)}
            className="w-full py-3 rounded-lg font-display text-[12px] font-bold uppercase tracking-[0.08em] text-primary border border-primary/30 hover:border-primary/50 hover:bg-primary/[0.04] transition-all cursor-pointer"
          >
            <span className="flex items-center justify-center gap-2">{tierFreeCount} free {config.label} ticket{tierFreeCount > 1 ? "s" : ""} <Dot /> Play now</span>
          </button>
        )}
      </div>
    );
  }

  if (phase === "scratching") {
    return (
      <div className="w-full py-3 text-center">
        <span className="font-mono text-[13px] font-semibold text-text-muted uppercase tracking-[0.1em] animate-pulse">Scratch all 3 zones to reveal</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <button onClick={() => setVisible(true)} className="w-full py-3.5 rounded-lg font-display text-[13px] font-bold uppercase tracking-[0.08em] text-primary bg-primary-container/30 hover:bg-primary-container/50 transition-all cursor-pointer">
        Connect Wallet to Play
      </button>
    );
  }

  const isLoading = ["buying", "sending", "confirming"].includes(phase);

  return (
    <div className="flex flex-col gap-2">
      <button onClick={onBuy} disabled={isLoading} className="w-full py-3.5 rounded-lg font-display text-[13px] font-extrabold uppercase tracking-[0.08em] text-on-primary hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" style={primaryStyle}>
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            <span className="text-[12px]">{phase === "buying" ? "Creating ticket..." : phase === "sending" ? "Approve in wallet..." : "Confirming on-chain..."}</span>
          </span>
        ) : <span className="flex items-center justify-center gap-2">Buy Ticket <Dot /> {config.ticketPrice} SOL</span>}
      </button>
      {!isLoading && tierFreeCount > 0 && (
        <button
          onClick={() => onPlayFree?.(tierFreeTickets[0]?.id)}
          className="w-full py-3 rounded-lg font-display text-[12px] font-bold uppercase tracking-[0.08em] text-primary border border-primary/30 hover:border-primary/50 hover:bg-primary/[0.04] transition-all cursor-pointer"
        >
          <span className="flex items-center justify-center gap-2">{tierFreeCount} free {config.label} ticket{tierFreeCount > 1 ? "s" : ""} <Dot /> Play now</span>
        </button>
      )}
    </div>
  );
}
