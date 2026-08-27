import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { VerifyClient } from "./VerifyClient";
import { formatLamports, truncateWallet } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ ticketId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticketId } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { totalPayoutLamports: true, tier: true, status: true },
  });

  if (!ticket || !["scratched", "paid"].includes(ticket.status)) {
    return { title: "Verify Ticket — PoolRaid" };
  }

  const isWin = ticket.totalPayoutLamports > 0n;
  const title = isWin
    ? `Won ${formatLamports(ticket.totalPayoutLamports)} SOL on ${ticket.tier} — PoolRaid`
    : `${ticket.tier} Scratch Ticket — PoolRaid`;

  return {
    title,
    description: isWin
      ? `Provably fair win of ${formatLamports(ticket.totalPayoutLamports)} SOL on PoolRaid. Verify the outcome on-chain.`
      : "Provably fair PoolRaid scratch ticket. Verify any game outcome.",
    openGraph: {
      images: [`/api/og/verify/${ticketId}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/api/og/verify/${ticketId}`],
    },
  };
}

export default async function VerifyPage({ params }: Props) {
  const { ticketId } = await params;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) notFound();

  const isScratched = ["scratched", "paid"].includes(ticket.status);
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  const explorerSuffix = network === "mainnet-beta" ? "" : `?cluster=${network}`;

  return (
    <main className="mx-auto max-w-[520px] min-h-screen px-4 py-8">
      <a href="/" className="flex items-center gap-2 mb-8">
        { }
        <img src="/images/ui/miniIconRaccoon.png" alt="" width={20} height={20} className="rounded-sm" />
        <span className="font-display text-lg font-black text-primary">PoolRaid</span>
      </a>

      <h1 className="font-display text-xl font-bold text-on-surface mb-1">Verify Ticket</h1>
      <p className="font-mono text-[11px] text-text-muted mb-6">
        Provably fair verification for ticket {ticketId.slice(0, 12)}...
      </p>

      {/* Ticket Info */}
      <section className="bg-surface-container rounded-xl p-4 mb-4 space-y-3">
        <Row label="Ticket ID" value={ticket.id} mono />
        <Row label="Tier" value={ticket.tier} capitalize />
        <Row label="Price" value={`${formatLamports(ticket.priceLamports)} SOL`} />
        <Row label="Status" value={ticket.status} capitalize />
        <Row label="Player" value={truncateWallet(ticket.playerWallet)} />
      </section>

      {/* Seed Info */}
      <section className="bg-surface-container rounded-xl p-4 mb-4 space-y-3">
        <h2 className="font-display text-[13px] font-bold text-on-surface">Seed Verification</h2>
        <Row label="Seed Hash (before)" value={ticket.seedHash} mono />
        {isScratched && ticket.seed ? (
          <>
            <Row label="Seed (revealed)" value={ticket.seed} mono />
            <VerifyClient seed={ticket.seed} seedHash={ticket.seedHash} />
          </>
        ) : (
          <p className="font-mono text-[11px] text-text-muted">Seed will be revealed after scratch</p>
        )}
      </section>

      {/* Zone Results */}
      {isScratched && (
        <section className="bg-surface-container rounded-xl p-4 mb-4 space-y-3">
          <h2 className="font-display text-[13px] font-bold text-on-surface">Zone Results</h2>
          {ticket.zone1Result && <ZoneRow zone="Zone 1 — Instant Win" result={ticket.zone1Result as Record<string, unknown>} />}
          {ticket.zone2Result && <ZoneRow zone="Zone 2 — Pool Raid" result={ticket.zone2Result as Record<string, unknown>} />}
          {ticket.zone3Result && <ZoneRow zone="Zone 3 — Free Ticket" result={ticket.zone3Result as Record<string, unknown>} />}
          <Row label="Total Payout" value={`${formatLamports(ticket.totalPayoutLamports)} SOL`} highlight={ticket.totalPayoutLamports > 0n} />
        </section>
      )}

      {/* Transaction Links */}
      <section className="bg-surface-container rounded-xl p-4 space-y-3">
        <h2 className="font-display text-[13px] font-bold text-on-surface">On-Chain</h2>
        {ticket.depositTx && (
          <a href={`https://explorer.solana.com/tx/${ticket.depositTx}${explorerSuffix}`} target="_blank" rel="noopener noreferrer" className="block font-mono text-[11px] text-primary hover:text-primary/80 transition-colors">
            Deposit TX &rarr; {ticket.depositTx.slice(0, 24)}...
          </a>
        )}
        {ticket.payoutTx && (
          <a href={`https://explorer.solana.com/tx/${ticket.payoutTx}${explorerSuffix}`} target="_blank" rel="noopener noreferrer" className="block font-mono text-[11px] text-primary hover:text-primary/80 transition-colors">
            Payout TX &rarr; {ticket.payoutTx.slice(0, 24)}...
          </a>
        )}
      </section>
    </main>
  );
}

function Row({ label, value, mono, highlight, capitalize }: { label: string; value: string; mono?: boolean; highlight?: boolean; capitalize?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted mb-0.5">{label}</p>
      <p className={`text-[11px] break-all ${mono ? "font-mono" : "font-body"} ${highlight ? "text-primary font-bold" : "text-on-surface-variant"} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function ZoneRow({ zone, result }: { zone: string; result: Record<string, unknown> }) {
  return (
    <div className="bg-surface-lowest rounded-lg p-3">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted mb-1">{zone}</p>
      <pre className="font-mono text-[10px] text-on-surface-variant whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
