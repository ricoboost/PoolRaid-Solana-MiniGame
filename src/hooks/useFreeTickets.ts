"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletSession } from "@/hooks/useWalletSession";

export interface FreeTicket {
  id: string;
  tier: string;
  price: number;
  createdAt: string;
}

export function useFreeTickets() {
  const { publicKey, connected } = useWallet();
  const [freeTickets, setFreeTickets] = useState<FreeTicket[]>([]);
  const { ensureSession } = useWalletSession();

  const refresh = useCallback(async () => {
    if (!publicKey) { setFreeTickets([]); return; }
    try {
      await ensureSession();
      const res = await fetch("/api/tickets/available");
      if (res.ok) setFreeTickets(await res.json());
    } catch { /* ignore */ }
  }, [publicKey, ensureSession]);

  useEffect(() => {
    if (connected) refresh();
    else setFreeTickets([]);
  }, [connected, refresh]);

  return { freeTickets, count: freeTickets.length, refresh };
}
