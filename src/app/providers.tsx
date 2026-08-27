"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { CustomWalletModal } from "@/components/CustomWalletModal";
import { SoundProvider } from "@/hooks/useSound";

// NOTE: NOT importing default wallet adapter styles — we use our custom modal

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SoundProvider>
            {children}
            <CustomWalletModal />
          </SoundProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
