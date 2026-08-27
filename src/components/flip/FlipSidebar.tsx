"use client";

import { FlipFeed } from "./FlipFeed";
import { UserCard } from "@/components/UserCard";
import { formatSOL } from "@/lib/utils";
import type { FlipTier } from "@/types";

interface Props {
  selectedTier: FlipTier;
}

export function FlipSidebar({ selectedTier }: Props) {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-3.5rem)] sticky top-14 bg-surface-low overflow-y-auto">
      {/* Flip info card */}
      <div className="m-3 mb-2 p-4 rounded-xl border border-surface-bright/30 bg-surface-high">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary/60 mb-1.5">
          Coin Flip
        </p>
        <p className="font-display text-[22px] font-black tracking-[-0.03em] text-on-surface leading-none">
          {formatSOL(selectedTier)} <span className="text-text-muted text-[12px]">SOL</span>
        </p>
        <p className="font-mono text-[10px] text-text-muted mt-1.5">
          Winner takes {formatSOL(selectedTier * 2 * 0.97)} SOL
        </p>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-surface-bright/20">
          <div>
            <p className="font-mono text-[8px] text-text-ghost uppercase">Pot</p>
            <p className="font-mono text-[12px] font-bold text-on-surface">{formatSOL(selectedTier * 2)}</p>
          </div>
          <div>
            <p className="font-mono text-[8px] text-text-ghost uppercase">Rake</p>
            <p className="font-mono text-[12px] font-bold text-lose/70">3%</p>
          </div>
          <div>
            <p className="font-mono text-[8px] text-text-ghost uppercase">Win</p>
            <p className="font-mono text-[12px] font-bold text-primary">{formatSOL(selectedTier * 2 * 0.97)}</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="px-3 pt-2">
        <p className="px-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted mb-2">Quick Links</p>
        <div className="space-y-1">
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-bright/50 transition-all">
            { }
            <img src="/images/brand/logo_head_front.webp" alt="" width={24} height={24} className="rounded-md" />
            <span className="font-display text-[12px] font-bold text-on-surface-variant">PoolRaid Scratch</span>
          </a>
          <a href="/leaderboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-bright/50 transition-all">
            <span className="w-6 h-6 rounded-md bg-surface-bright/50 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"/><path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"/><path d="M18 9h1.5a1 1 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6 9H4.5a1 1 0 0 1 0-5H6"/></svg>
            </span>
            <span className="font-display text-[12px] font-bold text-on-surface-variant">Leaderboard</span>
          </a>
        </div>
      </div>

      {/* Feed */}
      <div className="px-3 pt-4">
        <FlipFeed />
      </div>

      {/* User card */}
      <UserCard />
    </aside>
  );
}
