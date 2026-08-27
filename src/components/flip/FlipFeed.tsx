"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { formatSOL, timeAgo, truncateWallet } from "@/lib/utils";
import type { FlipHistoryItem } from "@/types";

export function FlipFeed() {
  const [history, setHistory] = useState<FlipHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { publicKey } = useWallet();
  const myWallet = publicKey?.toBase58() ?? null;

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/flip/history");
        const data = await res.json();
        if (data.history) setHistory(data.history.map((item: Record<string, unknown>) => ({
          ...item,
          tier: Number(item.tierLamports) / 1_000_000_000,
          potAmount: Number(item.potLamports) / 1_000_000_000,
          payoutAmount: Number(item.payoutLamports) / 1_000_000_000,
        })) as FlipHistoryItem[]);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-[13px] font-bold text-on-surface">Recent Flips</h2>
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

      {!loading && history.length === 0 && (
        <div className="text-center py-6 rounded-xl bg-surface-container">
          <p className="font-mono text-[11px] text-text-muted">No flips yet. Be the first!</p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div className="rounded-xl overflow-hidden overflow-y-auto" style={{ maxHeight: "calc(3 * 52px)" }}>
          {history.map((item, i) => {
            const isWinner = myWallet === item.winnerWallet;
            const isParticipant = myWallet === item.playerAWallet || myWallet === item.playerBWallet;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between py-2.5 px-3 ${
                  i % 2 === 0 ? "bg-surface-container" : "bg-surface-lowest"
                } ${isWinner ? "bg-primary-container/20" : isParticipant ? "bg-lose/[0.04]" : ""}`}
                style={{ animation: `feedIn 0.3s ${i * 0.04}s ease forwards`, opacity: 0 }}
              >
                <div className="flex flex-col">
                  <span className={`font-mono text-[12px] font-semibold ${
                    isWinner ? "text-primary" : "text-on-surface"
                  }`}>
                    {isWinner ? "YOU " : ""}{truncateWallet(item.winnerWallet)} won
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">
                    vs {truncateWallet(item.winnerWallet === item.playerAWallet ? item.playerBWallet : item.playerAWallet)}
                    {" "}&middot; {item.result}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-display text-[12px] font-extrabold text-primary">
                    +{formatSOL(item.payoutAmount)}
                  </span>
                  <span className="font-mono text-[10px] text-text-ghost">{timeAgo(item.completedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
