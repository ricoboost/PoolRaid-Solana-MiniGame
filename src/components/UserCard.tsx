"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useSound } from "@/hooks/useSound";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { formatSOL, truncateWallet } from "@/lib/utils";
import { useWalletSession } from "@/hooks/useWalletSession";

export function UserCard() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [avatar, setAvatar] = useState<string>("Abase");
  const [stats, setStats] = useState<{ totalWagered: number; totalWon: number; netPnl: number } | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [freeCount, setFreeCount] = useState(0);
  const { play } = useSound();
  const { ensureSession } = useWalletSession();

  const fetchData = useCallback(async () => {
    if (!publicKey) return;
    const wallet = publicKey.toBase58();
    try { await ensureSession(); } catch { return; }

    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch { /* ignore */ }

    try {
      const res = await fetch(`/api/player/stats?wallet=${wallet}`);
      if (res.ok) {
        const data = await res.json();
        setStats({ totalWagered: data.totalWagered, totalWon: data.totalWon, netPnl: data.netPnl });
      }
    } catch { /* ignore */ }

    try {
      const res = await fetch(`/api/player/profile?wallet=${wallet}&owner=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.avatar) setAvatar(data.avatar);
      }
    } catch { /* ignore */ }

    try {
      const res = await fetch("/api/tickets/available");
      if (res.ok) { const data = await res.json(); setFreeCount(data.length); }
    } catch { /* ignore */ }

    try {
      const res = await fetch(`/api/referral/code?wallet=${wallet}`);
      if (res.ok) {
        const data = await res.json();
        setRefCode(data.code);
      }
    } catch { /* ignore */ }
  }, [publicKey, connection, ensureSession]);

  useEffect(() => {
    if (connected) fetchData();
  }, [connected, fetchData]);

  if (!connected || !publicKey) {
    return (
      <div className="m-3 mt-auto p-3 rounded-xl bg-surface-container text-center">
        <p className="font-mono text-[11px] text-text-muted">Connect wallet to see your stats</p>
      </div>
    );
  }

  const pnl = stats?.netPnl ?? 0;
  const pnlPositive = pnl >= 0;

  return (
    <div className="m-3 mt-auto p-3 rounded-xl bg-surface-container space-y-2.5">
      {/* Wallet + balance */}
      <div className="flex items-center justify-between">
        <a href={`/profile/${publicKey.toBase58()}`} className="flex items-center gap-2 hover:text-primary transition-colors">
          { }
          <img src={`/images/avatars/${avatar}.webp`} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          <span className="font-mono text-[11px] font-semibold text-on-surface-variant">
            {truncateWallet(publicKey.toBase58())}
          </span>
        </a>
        {balance !== null && (
          <span className="font-display text-[12px] font-bold text-on-surface">
            {formatSOL(balance)} SOL
          </span>
        )}
      </div>

      {/* P&L */}
      {stats && (
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-md bg-surface-lowest p-1.5 text-center">
            <p className="font-mono text-[8px] text-text-muted uppercase">Wagered</p>
            <p className="font-display text-[11px] font-bold text-on-surface">{formatSOL(stats.totalWagered)}</p>
          </div>
          <div className="rounded-md bg-surface-lowest p-1.5 text-center">
            <p className="font-mono text-[8px] text-text-muted uppercase">Won</p>
            <p className="font-display text-[11px] font-bold text-primary">{formatSOL(stats.totalWon)}</p>
          </div>
          <div className="rounded-md bg-surface-lowest p-1.5 text-center">
            <p className="font-mono text-[8px] text-text-muted uppercase">P&L</p>
            <p className={`font-display text-[11px] font-bold ${pnlPositive ? "text-primary" : "text-lose"}`}>
              {pnlPositive ? "+" : ""}{formatSOL(pnl)}
            </p>
          </div>
        </div>
      )}

      {/* Free tickets badge */}
      {freeCount > 0 && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-primary/[0.06]">
          <span className="font-mono text-[10px] text-primary font-bold">{"\u{1F39F}\uFE0F"} {freeCount} free ticket{freeCount > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Referral */}
      {refCode && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/r/${refCode}`);
            play("copy");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-surface-lowest hover:bg-surface-bright/50 transition-all cursor-pointer"
        >
          <span className="font-mono text-[10px] text-text-muted truncate">
            /r/<span className="text-on-surface-variant">{refCode}</span>
          </span>
          <span className="font-mono text-[9px] font-bold text-primary flex-shrink-0 ml-2">
            {copied ? "Copied!" : "Copy"}
          </span>
        </button>
      )}
    </div>
  );
}
