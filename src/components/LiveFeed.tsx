"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useFeed } from "@/hooks/useFeed";
import { formatSOL, timeAgo, truncateWallet } from "@/lib/utils";
import { getTierConfig } from "@/lib/tiers";
import Image from "next/image";
import type { Tier } from "@/types";

export function LiveFeed() {
  const { feed, loading } = useFeed();
  const { publicKey } = useWallet();
  const myWallet = publicKey ? truncateWallet(publicKey.toBase58()) : null;

  return (
    <section className="mt-6 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-[13px] font-bold text-on-surface">Recent Wins</h2>
        <div className="flex items-center gap-1.5">
          <span className="relative w-[5px] h-[5px]">
            <span className="absolute inset-0 rounded-full bg-primary animate-[livePulse_2s_ease-in-out_infinite]" />
            <span className="absolute inset-0 rounded-full bg-primary animate-[ping_2s_ease-in-out_infinite]" />
          </span>
          <span className="font-mono text-[11px] font-bold text-primary tracking-[0.05em]">LIVE</span>
        </div>
      </div>

      {loading && (
        <div className="space-y-1">
          {[...Array(3)].map((_, i) => <div key={i} className="h-11 rounded-lg bg-surface-container animate-pulse" />)}
        </div>
      )}

      {!loading && feed.length === 0 && (
        <div className="text-center py-8 rounded-xl bg-surface-container">
          <Image src="/images/ui/state_no_wins.webp" alt="No wins" width={64} height={64} className="mx-auto mb-2 opacity-50" />
          <p className="font-mono text-[13px] text-text-muted">No wins yet. Be the first!</p>
        </div>
      )}

      {!loading && feed.length > 0 && (
        <div className="rounded-xl overflow-hidden max-h-[280px] overflow-y-auto">
          {feed.map((item, i) => {
            const tierConfig = getTierConfig(item.tier as Tier);
            const isBigWin = item.amount >= tierConfig.ticketPrice * 5;
            const isYou = myWallet === item.wallet;

            return (
              <div
                key={`${item.wallet}-${item.timestamp}-${i}`}
                className={`flex items-center justify-between py-2.5 px-3 ${
                  i % 2 === 0 ? "bg-surface-container" : "bg-surface-lowest"
                } ${isYou ? "bg-primary-container/20" : isBigWin ? "bg-tertiary-container/10" : ""}`}
                style={{ animation: `feedIn 0.3s ${i * 0.04}s ease forwards`, opacity: 0 }}
              >
                <div className="flex flex-col">
                  <span className={`font-mono text-[13px] font-semibold ${isYou ? "text-primary" : "text-on-surface"}`}>
                    {isYou ? "YOU " : isBigWin ? "\u{1F525} " : ""}{item.wallet}
                  </span>
                  <span className="font-mono text-[11px] text-text-muted flex items-center gap-1">
                    { }
                    <img src={`/images/tiers/${item.tier}_coin.webp`} alt="" width={14} height={14} className="rounded-full" />
                    {tierConfig.label} &middot; {item.type}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`font-display text-[12px] font-extrabold ${isBigWin ? "text-tertiary" : "text-primary"}`}>
                    +{formatSOL(item.amount)}
                  </span>
                  <span className="font-mono text-[11px] text-text-ghost">{timeAgo(item.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
