"use client";

import { truncateWallet } from "@/lib/utils";

type SeatState = "empty" | "occupied" | "winner" | "loser";

interface Props {
  state: SeatState;
  wallet: string | null;
  avatar: string;
  side: "heads" | "tails";
  isCurrentUser?: boolean;
  onSit?: () => void;
}

export function FlipSeatCircle({ state, wallet, avatar, side, isCurrentUser, onSit }: Props) {
  if (state === "empty") {
    return (
      <button
        onClick={onSit}
        className="flex flex-col items-center gap-1.5 group cursor-pointer"
      >
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-surface-bright/60 group-hover:border-primary/60 flex items-center justify-center transition-all animate-[seatPulse_2s_ease-in-out_infinite]">
          <span className="text-text-muted group-hover:text-primary text-lg transition-colors">+</span>
        </div>
        <span className="font-mono text-[9px] text-text-ghost uppercase tracking-wider">
          {side === "heads" ? "Heads" : "Tails"}
        </span>
      </button>
    );
  }

  const borderClass =
    state === "winner"
      ? "border-primary animate-[winnerGlow_1.5s_ease-in-out_infinite]"
      : state === "loser"
      ? "border-lose/30 opacity-50"
      : isCurrentUser
      ? "border-primary/60"
      : "border-surface-bright";

  const bgClass =
    state === "winner"
      ? "bg-primary/10"
      : state === "loser"
      ? "bg-lose/5"
      : "bg-surface-container";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-14 h-14 rounded-full border-2 ${borderClass} ${bgClass} flex items-center justify-center transition-all overflow-hidden`}>
        { }
        <img
          src={`/images/avatars/${avatar}.webp`}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col items-center">
        <span className={`font-mono text-[10px] font-semibold ${
          state === "winner" ? "text-primary" : state === "loser" ? "text-text-ghost" : "text-on-surface-variant"
        }`}>
          {wallet ? truncateWallet(wallet) : "---"}
        </span>
        <span className={`font-mono text-[8px] uppercase tracking-wider ${
          state === "winner" ? "text-primary/60" : "text-text-ghost"
        }`}>
          {side === "heads" ? "Heads" : "Tails"}
        </span>
      </div>
    </div>
  );
}
