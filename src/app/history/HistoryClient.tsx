"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { formatSOL, timeAgo, truncateWallet } from "@/lib/utils";
import { getTierConfig } from "@/lib/tiers";
import type { Tier, Zone1Result, Zone2Result, Zone3Result } from "@/types";
import { useWalletSession } from "@/hooks/useWalletSession";

interface TicketRecord {
  id: string;
  tier: string;
  price: number;
  zone1Result: Zone1Result | null;
  zone2Result: Zone2Result | null;
  zone3Result: Zone3Result | null;
  totalPayout: number;
  payoutTx: string | null;
  status: string;
  isFreeTicket: boolean;
  createdAt: string;
  scratchedAt: string | null;
}

interface PlayerStats {
  totalWagered: number;
  totalWon: number;
  netPnl: number;
  totalTickets: number;
  winningTickets: number;
  winRate: number;
  freeTickets: number;
  unclaimed: number;
  unclaimedAmount: number;
}

export function HistoryClient() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const { ensureSession } = useWalletSession();

  const fetchData = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      await ensureSession();
      const wallet = publicKey.toBase58();
      const [historyRes, statsRes] = await Promise.all([
        fetch(`/api/player/history?wallet=${wallet}`),
        fetch(`/api/player/stats?wallet=${wallet}`),
      ]);
      if (historyRes.ok) {
        const histData = await historyRes.json();
        setTickets(histData.tickets || histData);
      }
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  }, [publicKey, ensureSession]);

  useEffect(() => {
    if (connected) fetchData();
  }, [connected, fetchData]);

  const [claimingAll, setClaimingAll] = useState(false);
  const [claimProgress, setClaimProgress] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);

  const claimTicket = async (ticketId: string) => {
    setClaimingId(ticketId);
    setClaimError(null);
    try {
      await ensureSession();
      const res = await fetch("/api/tickets/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, walletAddress: publicKey?.toBase58() }),
      });
      if (!res.ok) {
        const err = await res.json();
        setClaimError(err.error || "Claim failed");
        return;
      }
      await fetchData();
    } catch {
      setClaimError("Claim failed — check your connection and try again");
    } finally {
      setClaimingId(null);
    }
  };

  const claimAll = async () => {
    const unclaimed = tickets.filter((t) => (t.status === "scratched" || (t.status === "claiming" && !t.payoutTx)) && t.totalPayout > 0);
    if (unclaimed.length === 0) return;
    setClaimingAll(true);
    await ensureSession();
    for (let i = 0; i < unclaimed.length; i++) {
      setClaimProgress(`${i + 1}/${unclaimed.length}`);
      try {
        await fetch("/api/tickets/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId: unclaimed[i].id }),
        });
      } catch {
        // continue with next
      }
    }
    setClaimingAll(false);
    setClaimProgress("");
    await fetchData();
  };

  if (!connected) {
    return (
      <div className="text-center py-16">
        <p className="font-display text-lg font-bold text-on-surface mb-2">
          Connect Wallet
        </p>
        <p className="font-mono text-[10px] text-text-muted mb-4">
          View your ticket history and claim uncollected winnings
        </p>
        <button
          onClick={() => setVisible(true)}
          className="px-6 py-2.5 rounded-xl font-display text-[12px] font-extrabold uppercase tracking-[0.08em] text-on-primary cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #2be88e, #34fea0 50%, #2be88e)",
            boxShadow: "0 4px 20px rgba(52,254,160,0.2)",
          }}
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 py-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-surface-container/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const unclaimedTickets = tickets.filter(
    (t) => (t.status === "scratched" || (t.status === "claiming" && !t.payoutTx)) && t.totalPayout > 0
  );

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  const explorerSuffix = network === "mainnet-beta" ? "" : `?cluster=${network}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-lg font-bold text-on-surface">
            My Tickets
          </h1>
          <p className="font-mono text-[9px] text-text-muted">
            {truncateWallet(publicKey!.toBase58())}
          </p>
        </div>
        <button
          onClick={() => setIsPublic(!isPublic)}
          className={`px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-[0.08em] border transition-all cursor-pointer ${
            isPublic
              ? "border-primary/30 text-primary bg-primary/[0.08]"
              : "border-surface-bright/40 text-on-surface-variant bg-transparent"
          }`}
        >
          {isPublic ? "\u{1F513} Public" : "\u{1F512} Private"}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          <StatBox label="Wagered" value={`${formatSOL(stats.totalWagered)} SOL`} />
          <StatBox
            label="Won"
            value={`${formatSOL(stats.totalWon)} SOL`}
            highlight
          />
          <StatBox
            label="Net P&L"
            value={`${stats.netPnl >= 0 ? "+" : ""}${formatSOL(stats.netPnl)} SOL`}
            color={stats.netPnl >= 0 ? "text-primary" : "text-lose"}
          />
          <StatBox
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            sub={`${stats.winningTickets}/${stats.totalTickets}`}
          />
        </div>
      )}

      {/* Unclaimed banner */}
      {unclaimedTickets.length > 0 && (
        <div
          className="rounded-xl p-4 mb-5 border border-primary/20"
          style={{
            background: "linear-gradient(160deg, #0a2a18 0%, #071f14 100%)",
            boxShadow: "0 0 20px rgba(0,232,120,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-sm font-bold text-primary">
              Unclaimed Winnings
            </span>
            <span className="font-display text-lg font-black text-primary">
              {formatSOL(stats?.unclaimedAmount ?? 0)} SOL
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[9px] text-primary/60">
              {unclaimedTickets.length} ticket{unclaimedTickets.length > 1 ? "s" : ""} awaiting claim
            </p>
            {unclaimedTickets.length > 1 && (
              <button
                onClick={claimAll}
                disabled={claimingAll}
                className="px-3 py-1 rounded-lg font-display text-[9px] font-bold uppercase text-white cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #007a3d, #00e878 50%, #007a3d)" }}
              >
                {claimingAll ? `Claiming ${claimProgress}...` : "Claim All"}
              </button>
            )}
          </div>
          {claimError && (
            <p className="font-mono text-[10px] text-lose text-center mb-2">{claimError}</p>
          )}
          <div className="space-y-1.5">
            {unclaimedTickets.map((t) => {
              const config = getTierConfig(t.tier as Tier);
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-lowest/40"
                >
                  <div className="flex items-center gap-2">
                    { }
                    <img src={`/images/tiers/${t.tier}_coin.webp`} alt="" width={16} height={16} className="rounded-full" />
                    <div>
                      <span className="font-display text-[11px] font-bold text-on-surface">
                        {config.label}
                      </span>
                      <span className="font-mono text-[8px] text-text-muted ml-1.5">
                        {t.isFreeTicket ? "FREE" : `${t.price} SOL`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => claimTicket(t.id)}
                    disabled={claimingId === t.id}
                    className="px-3 py-1.5 rounded-lg font-display text-[10px] font-extrabold uppercase text-white cursor-pointer disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #007a3d, #00e878 50%, #007a3d)",
                    }}
                  >
                    {claimingId === t.id ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ...
                      </span>
                    ) : (
                      `Claim ${formatSOL(t.totalPayout)}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ticket history */}
      <h2 className="font-display text-sm font-bold text-on-surface-variant mb-3">
        All Tickets
      </h2>
      {tickets.length === 0 && (
        <div className="text-center py-8 rounded-xl bg-surface-container/30 border border-surface-bright/20">
          <p className="font-mono text-[10px] text-text-muted">No tickets yet</p>
        </div>
      )}
      <div className="space-y-1.5">
        {tickets.map((t) => {
          const config = getTierConfig(t.tier as Tier);
          const isWin = t.totalPayout > 0;
          const isPaid = t.status === "paid";
          const isUnclaimed = (t.status === "scratched" || (t.status === "claiming" && !t.payoutTx)) && isWin;
          const isScratched = ["scratched", "paid", "claiming"].includes(t.status);

          return (
            <div
              key={t.id}
              className={`flex items-center justify-between py-2.5 px-3 rounded-xl border transition-all ${
                isUnclaimed
                  ? "border-primary/20 bg-primary/[0.03]"
                  : "border-surface-bright/20 bg-surface-container/30"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                { }
                <img src={`/images/tiers/${t.tier}_coin.webp`} alt="" width={18} height={18} className="rounded-full flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-[11px] font-bold text-on-surface">
                      {config.label}
                    </span>
                    {t.isFreeTicket && (
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-bold bg-primary/10 text-primary uppercase">
                        Free
                      </span>
                    )}
                    {isUnclaimed && (
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-bold bg-primary/10 text-primary uppercase animate-pulse">
                        Claim
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[8px] text-text-ghost">
                      {timeAgo(t.createdAt)}
                    </span>
                    {isScratched && t.zone1Result && (
                      <span className="font-mono text-[8px] text-text-muted">
                        {(t.zone1Result as Zone1Result).label}
                      </span>
                    )}
                    {isPaid && t.payoutTx && (
                      <a
                        href={`https://explorer.solana.com/tx/${t.payoutTx}${explorerSuffix}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[8px] text-primary hover:text-primary"
                      >
                        tx &rarr;
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {isWin ? (
                  <span className="font-display text-[13px] font-extrabold text-primary">
                    +{formatSOL(t.totalPayout)}
                  </span>
                ) : isScratched ? (
                  <span className="font-mono text-[10px] text-text-muted">
                    0
                  </span>
                ) : (
                  <span className="font-mono text-[8px] text-text-ghost uppercase">
                    {t.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
  highlight,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-container/50 border border-surface-bright/20 p-3">
      <p className="font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-text-muted mb-1">
        {label}
      </p>
      <p
        className={`font-display text-[15px] font-extrabold ${
          color || (highlight ? "text-primary" : "text-on-surface")
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="font-mono text-[8px] text-text-ghost mt-0.5">{sub}</p>
      )}
    </div>
  );
}
