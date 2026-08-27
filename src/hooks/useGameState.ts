"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Transaction,
  SystemProgram,
  PublicKey,
} from "@solana/web3.js";
import type { Tier, ScratchResult, BuyResponse } from "@/types";
import { createDepositMemoInstruction } from "@/lib/solana-client";
import { lamportsToSolNumber } from "@/lib/money";
import { useWalletSession } from "@/hooks/useWalletSession";

export type GamePhase =
  | "idle"
  | "buying"
  | "sending"
  | "confirming"
  | "scratching"
  | "revealed"
  | "claiming"
  | "claimed";

export interface SessionStats {
  wagered: number;
  won: number;
  tickets: number;
}

export interface GameState {
  phase: GamePhase;
  ticketId: string | null;
  seedHash: string | null;
  result: ScratchResult | null;
  zonesRevealed: [boolean, boolean, boolean];
  error: string | null;
  freeTicketId: string | null;
  freeTicketTier: string | null;
  payoutTx: string | null;
  session: SessionStats;
}

const initialState: GameState = {
  phase: "idle",
  ticketId: null,
  seedHash: null,
  result: null,
  zonesRevealed: [false, false, false],
  error: null,
  freeTicketId: null,
  freeTicketTier: null,
  payoutTx: null,
  session: { wagered: 0, won: 0, tickets: 0 },
};

export function useGameState() {
  const [state, setState] = useState<GameState>(initialState);
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { ensureSession } = useWalletSession();

  const buyTicket = useCallback(
    async (tier: Tier) => {
      if (!publicKey) {
        setState((s) => ({ ...s, error: "Connect your wallet first" }));
        return;
      }

      setState((s) => ({
        ...s,
        phase: "buying",
        ticketId: null,
        seedHash: null,
        result: null,
        zonesRevealed: [false, false, false],
        error: null,
        freeTicketId: null,
        freeTicketTier: null,
        payoutTx: null,
      }));

      try {
        await ensureSession();
        const buyRes = await fetch("/api/tickets/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier,
            referralCode: typeof window !== "undefined" ? localStorage.getItem("vault_ref") : null,
          }),
        });
        if (!buyRes.ok) {
          const err = await buyRes.json();
          throw new Error(err.error || "Failed to create ticket");
        }
        const buyData: BuyResponse = await buyRes.json();

        setState((s) => ({
          ...s,
          phase: "sending",
          ticketId: buyData.ticketId,
          seedHash: buyData.seedHash,
        }));

        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(buyData.depositAddress),
            lamports: BigInt(buyData.amountLamports),
          }),
          createDepositMemoInstruction(buyData.memo),
        );

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = publicKey;

        const signed = await signTransaction!(tx);
        const rawTx = signed.serialize();
        const signature = await connection.sendRawTransaction(rawTx);
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "finalized");

        setState((s) => ({ ...s, phase: "confirming" }));

        const confirmRes = await fetch("/api/tickets/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: buyData.ticketId,
            txSignature: signature,
          }),
        });
        if (!confirmRes.ok) {
          const err = await confirmRes.json();
          throw new Error(err.error || "Failed to confirm deposit");
        }

        const scratchRes = await fetch("/api/tickets/scratch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId: buyData.ticketId }),
        });
        if (!scratchRes.ok) {
          const err = await scratchRes.json();
          throw new Error(err.error || "Scratch failed");
        }
        const result: ScratchResult = await scratchRes.json();

        setState((s) => ({
          ...s,
          phase: "scratching",
          result,
          freeTicketId: result.freeTicketId || null,
          freeTicketTier: result.freeTicketTier || null,
          session: {
            wagered: s.session.wagered + lamportsToSolNumber(buyData.amountLamports),
            won: s.session.won,
            tickets: s.session.tickets + 1,
          },
        }));
      } catch (err) {
        let message = "Transaction failed";
        if (err instanceof Error) {
          const msg = err.message.toLowerCase();
          if (msg.includes("rejected") || msg.includes("denied") || msg.includes("cancelled")) {
            message = "Transaction cancelled — no SOL was spent";
          } else if (msg.includes("insufficient") || msg.includes("not enough")) {
            message = "Insufficient SOL balance in your wallet";
          } else {
            message = err.message;
          }
        }
        setState((s) => ({ ...s, phase: "idle", error: message }));
      }
    },
    [publicKey, signTransaction, connection, ensureSession]
  );

  const playFreeTicket = useCallback(async (ticketId?: string) => {
    const freeId = ticketId || state.freeTicketId;
    if (!freeId) return;

    setState((s) => ({
      ...s,
      phase: "confirming",
      ticketId: freeId,
      seedHash: null,
      result: null,
      zonesRevealed: [false, false, false],
      error: null,
      freeTicketId: null,
      freeTicketTier: null,
      payoutTx: null,
    }));

    try {
      await ensureSession();
      const scratchRes = await fetch("/api/tickets/scratch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: freeId }),
      });
      if (!scratchRes.ok) {
        const err = await scratchRes.json();
        throw new Error(err.error || "Scratch failed");
      }
      const result: ScratchResult = await scratchRes.json();

      setState((s) => ({
        ...s,
        phase: "scratching",
        ticketId: freeId,
        result,
        freeTicketId: result.freeTicketId || null,
        freeTicketTier: result.freeTicketTier || null,
        session: { ...s.session, tickets: s.session.tickets + 1 },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Free ticket failed";
      setState((s) => ({ ...s, phase: "idle", error: message }));
    }
  }, [state.freeTicketId, ensureSession]);

  const claimPayout = useCallback(async () => {
    if (!state.ticketId || !state.result || BigInt(state.result.totalPayoutLamports) <= 0n) return;

    setState((s) => ({ ...s, phase: "claiming" }));

    try {
      await ensureSession();
      const res = await fetch("/api/tickets/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: state.ticketId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Claim failed");
      }
      const data = await res.json();

      setState((s) => ({
        ...s,
        phase: "claimed",
        payoutTx: data.payoutTx,
        session: { ...s.session, won: s.session.won + lamportsToSolNumber(s.result?.totalPayoutLamports ?? "0") },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Claim failed";
      setState((s) => ({ ...s, phase: "revealed", error: message }));
    }
  }, [state.ticketId, state.result, ensureSession]);

  const revealZone = useCallback((zoneIndex: 0 | 1 | 2) => {
    setState((prev) => {
      const newRevealed = [...prev.zonesRevealed] as [boolean, boolean, boolean];
      newRevealed[zoneIndex] = true;
      const allRevealed = newRevealed.every(Boolean);
      return {
        ...prev,
        zonesRevealed: newRevealed,
        phase: allRevealed ? "revealed" : prev.phase,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({
      ...initialState,
      session: s.session, // preserve session stats
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return { state, buyTicket, playFreeTicket, claimPayout, revealZone, reset, clearError };
}
