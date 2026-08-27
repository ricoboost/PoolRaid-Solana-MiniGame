"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSound } from "@/hooks/useSound";
import { truncateWallet } from "@/lib/utils";

export function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { play } = useSound();
  const wasConnected = useState(false);

  useEffect(() => setMounted(true), []);

  // Play connect/disconnect sounds
  useEffect(() => {
    if (!mounted) return;
    if (connected && !wasConnected[0]) play("wallet_connect");
    if (!connected && wasConnected[0]) play("wallet_disconnect");
    wasConnected[1](connected);
  }, [connected, mounted, play, wasConnected]);

  // Render connect button on server and before hydration to avoid mismatch
  if (!mounted || !connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="flex items-center gap-2 px-5 py-2 rounded-lg font-display text-[12px] font-black uppercase tracking-[0.08em] text-on-primary cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
        style={{
          background: "linear-gradient(135deg, #2be88e 0%, #34fea0 50%, #2be88e 100%)",
          boxShadow: "0 0 20px rgba(52,254,160,0.2), 0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
        Connect
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <a
        href={`/profile/${publicKey.toBase58()}`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-high font-mono text-[13px] font-semibold text-on-surface-variant hover:bg-surface-bright transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
        {truncateWallet(publicKey.toBase58())}
      </a>
      <button
        onClick={() => { disconnect(); router.push("/"); }}
        className="p-1.5 rounded-md text-text-muted hover:text-lose hover:bg-surface-bright/50 transition-all cursor-pointer"
        title="Disconnect wallet"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v10" />
          <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
        </svg>
      </button>
    </div>
  );
}
