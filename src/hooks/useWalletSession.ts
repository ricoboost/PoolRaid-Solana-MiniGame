"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

let inFlight: { key: string; promise: Promise<{ wallet: string; role: string }> } | null = null;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export function useWalletSession() {
  const { publicKey, signMessage } = useWallet();
  const authenticate = useCallback(async (purpose: "player" | "admin" = "player") => {
    if (!publicKey || !signMessage) throw new Error("Wallet message signing is required");
    const wallet = publicKey.toBase58();
    const existing = await fetch("/api/auth/session", { cache: "no-store" });
    if (existing.ok) {
      const session = await existing.json();
      if (session.wallet === wallet && (purpose === "player" || session.role === "admin")) return session;
      await fetch("/api/auth/session", { method: "DELETE" });
    }
    const challengeResponse = await fetch("/api/auth/nonce", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallet, purpose }),
    });
    if (!challengeResponse.ok) throw new Error("Unable to create wallet challenge");
    const challenge = await challengeResponse.json();
    const signature = await signMessage(new TextEncoder().encode(challenge.message));
    const verifyResponse = await fetch("/api/auth/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: challenge.id, signature: toBase64(signature) }),
    });
    if (!verifyResponse.ok) throw new Error("Wallet authentication failed");
    return verifyResponse.json();
  }, [publicKey, signMessage]);
  const ensureSession = useCallback((purpose: "player" | "admin" = "player") => {
    if (!publicKey) return Promise.reject(new Error("Connect your wallet first"));
    const key = `${publicKey.toBase58()}:${purpose}`;
    if (inFlight?.key === key) return inFlight.promise;
    const promise = authenticate(purpose).finally(() => {
      if (inFlight?.promise === promise) inFlight = null;
    });
    inFlight = { key, promise };
    return promise;
  }, [authenticate, publicKey]);
  return { ensureSession };
}
