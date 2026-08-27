"use client";

import { useWallet } from "@solana/wallet-adapter-react";

export function ProfileLink() {
  const { publicKey, connected } = useWallet();

  if (!connected || !publicKey) return null;

  return (
    <a
      href={`/profile/${publicKey.toBase58()}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-bright/50 transition-all"
    >
      <span className="w-6 h-6 rounded-md bg-surface-bright/50 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </span>
      <span className="font-display text-[12px] font-bold text-on-surface-variant">My Profile</span>
    </a>
  );
}
