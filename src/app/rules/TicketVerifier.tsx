"use client";

import { useState } from "react";
import { formatLamports } from "@/lib/utils";

interface VerifyResult {
  ticketId: string;
  tier: string;
  priceLamports: string;
  seedHash: string;
  seed: string | null;
  zone1Result: { label: string; multiplier: number; payoutLamports: string; capped: boolean; rawPayoutLamports: string } | null;
  zone2Result: { label: string; poolPct: number; payoutLamports: string } | null;
  zone3Result: { label: string; type: string } | null;
  totalPayoutLamports: string;
  payoutTx: string | null;
  depositTx: string | null;
  status: string;
  playerWallet: string;
}

export function TicketVerifier() {
  const [ticketId, setTicketId] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [hashMatch, setHashMatch] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verify = async () => {
    if (!ticketId.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setHashMatch(null);
    try {
      const res = await fetch(`/api/tickets/verify/${ticketId.trim()}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ticket not found");
        return;
      }
      const data: VerifyResult = await res.json();
      setResult(data);
      if (data.seed) {
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data.seed));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computed = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        setHashMatch(computed === data.seedHash);
      }
    } catch {
      setError("Failed to fetch ticket");
    } finally {
      setLoading(false);
    }
  };

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  const explorerSuffix = network === "mainnet-beta" ? "" : `?cluster=${network}`;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          placeholder="Enter ticket ID"
          className="flex-1 px-3 py-2.5 rounded-xl bg-surface-highest font-mono text-[12px] text-on-surface placeholder:text-text-ghost outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={verify}
          disabled={loading || !ticketId.trim()}
          className="px-5 py-2.5 rounded-xl font-display text-[12px] font-bold uppercase text-on-primary cursor-pointer disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #2be88e, #34fea0 50%, #2be88e)" }}
        >
          {loading ? "..." : "Verify"}
        </button>
      </div>

      {error && <p className="font-mono text-[12px] text-lose mb-4">{error}</p>}

      {result && (
        <div className="rounded-xl bg-surface-container overflow-hidden">
          {result.seed && hashMatch !== null && (
            <div className={`px-4 py-3 ${hashMatch ? "bg-primary/[0.06]" : "bg-lose/[0.06]"}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{hashMatch ? "\u2705" : "\u274C"}</span>
                <span className={`font-mono text-[12px] font-bold ${hashMatch ? "text-primary" : "text-lose"}`}>
                  {hashMatch ? "SHA-256 verified \u2014 seed matches hash" : "VERIFICATION FAILED"}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 space-y-3">
            <Row label="Ticket ID" value={result.ticketId} mono />
            <Row label="Status" value={result.status.toUpperCase()} />
            <Row label="Tier" value={result.tier} />
            <Row label="Price" value={`${formatLamports(result.priceLamports)} SOL`} />
            <Row label="Player" value={result.playerWallet} mono />

            <div className="border-t border-surface-bright/20 pt-3">
              <Row label="Seed Hash" value={result.seedHash} mono />
              {result.seed ? <Row label="Seed" value={result.seed} mono /> : (
                <p className="font-mono text-[11px] text-text-ghost mt-1">Seed hidden \u2014 ticket not yet scratched</p>
              )}
            </div>

            {result.zone1Result && (
              <div className="border-t border-surface-bright/20 pt-3">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted mb-2">Zone Results</p>
                <div className="grid grid-cols-3 gap-2">
                  <ZoneBox zone="Zone 1" label={result.zone1Result.label} detail={BigInt(result.zone1Result.payoutLamports) > 0n ? `+${formatLamports(result.zone1Result.payoutLamports)} SOL` : "No win"} isWin={BigInt(result.zone1Result.payoutLamports) > 0n} />
                  {result.zone2Result && <ZoneBox zone="Zone 2" label={result.zone2Result.label} detail={BigInt(result.zone2Result.payoutLamports) > 0n ? `+${formatLamports(result.zone2Result.payoutLamports)} SOL` : "No raid"} isWin={BigInt(result.zone2Result.payoutLamports) > 0n} />}
                  {result.zone3Result && <ZoneBox zone="Zone 3" label={result.zone3Result.label} detail={result.zone3Result.type !== "nothing" ? "Free ticket!" : "Nothing"} isWin={result.zone3Result.type !== "nothing"} />}
                </div>
              </div>
            )}

            <div className="border-t border-surface-bright/20 pt-3">
              <Row label="Total Payout" value={`${formatLamports(result.totalPayoutLamports)} SOL`} highlight={BigInt(result.totalPayoutLamports) > 0n} />
              {result.depositTx && <a href={`https://explorer.solana.com/tx/${result.depositTx}${explorerSuffix}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-text-muted hover:text-primary block mt-1">Deposit TX &rarr;</a>}
              {result.payoutTx && <a href={`https://explorer.solana.com/tx/${result.payoutTx}${explorerSuffix}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[11px] text-text-muted hover:text-primary block mt-1">Payout TX &rarr;</a>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">{label}</p>
      <p className={`text-[12px] break-all ${mono ? "font-mono" : "font-body"} ${highlight ? "text-primary font-bold" : "text-on-surface"}`}>{value}</p>
    </div>
  );
}

function ZoneBox({ zone, label, detail, isWin }: { zone: string; label: string; detail: string; isWin: boolean }) {
  return (
    <div className={`rounded-lg p-2.5 text-center ${isWin ? "bg-primary/[0.06]" : "bg-surface-lowest"}`}>
      <p className="font-mono text-[9px] text-text-ghost uppercase">{zone}</p>
      <p className={`font-display text-[11px] font-bold ${isWin ? "text-primary" : "text-text-muted"}`}>{label}</p>
      <p className="font-mono text-[10px] text-on-surface-variant">{detail}</p>
    </div>
  );
}
