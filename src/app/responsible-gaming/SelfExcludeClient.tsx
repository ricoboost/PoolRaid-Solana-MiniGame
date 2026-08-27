"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWalletSession } from "@/hooks/useWalletSession";

const DURATIONS = [
  { label: "24 Hours", value: "24h" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "Permanent", value: "permanent" },
];

export function SelfExcludeClient() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { ensureSession } = useWalletSession();

  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="w-full py-2.5 rounded-xl border border-[--border-medium] font-body text-[11px] font-semibold text-text-secondary cursor-pointer"
      >
        Connect wallet to self-exclude
      </button>
    );
  }

  const handleExclude = async (duration: string) => {
    if (!publicKey) return;
    setLoading(true);
    try {
      await ensureSession();
      const res = await fetch("/api/self-exclude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          ownerWallet: publicKey.toBase58(),
          duration,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(
          duration === "permanent"
            ? "Your wallet has been permanently excluded from PoolRaid."
            : `Your wallet is excluded until ${new Date(data.excludeUntil).toLocaleDateString()}.`
        );
        setConfirming(null);
      } else {
        setResult(data.error || "Failed to self-exclude");
      }
    } catch {
      setResult("Failed to self-exclude");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="p-4 rounded-xl bg-bg-card/50 border border-[--border-faint]">
        <p className="font-body text-[11px] text-text-primary">{result}</p>
      </div>
    );
  }

  if (confirming) {
    const isPermanent = confirming === "permanent";
    return (
      <div className="p-4 rounded-xl bg-lose/[0.06] border border-lose/15">
        <p className="font-display text-sm font-bold text-lose mb-2">
          {isPermanent ? "Permanent Self-Exclusion" : `Self-Exclude for ${DURATIONS.find((d) => d.value === confirming)?.label}`}
        </p>
        <p className="font-body text-[11px] text-text-secondary mb-3 leading-relaxed">
          {isPermanent
            ? "This action is IRREVERSIBLE. Your wallet will be permanently blocked from playing on PoolRaid. You will not be able to undo this."
            : "During the exclusion period, you will not be able to buy tickets or claim winnings. This cannot be reversed before the period ends."}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleExclude(confirming)}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-lose/20 border border-lose/30 font-display text-[11px] font-bold text-lose cursor-pointer disabled:opacity-50"
          >
            {loading ? "Processing..." : "Confirm Exclusion"}
          </button>
          <button
            onClick={() => setConfirming(null)}
            className="px-4 py-2 rounded-lg border border-[--border-faint] font-body text-[11px] text-text-muted cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {DURATIONS.map((d) => (
        <button
          key={d.value}
          onClick={() => setConfirming(d.value)}
          className={`py-2.5 rounded-xl border font-body text-[11px] font-semibold cursor-pointer transition-all ${
            d.value === "permanent"
              ? "border-lose/20 text-lose hover:bg-lose/[0.06]"
              : "border-[--border-medium] text-text-secondary hover:text-text-primary hover:bg-bg-hover"
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
