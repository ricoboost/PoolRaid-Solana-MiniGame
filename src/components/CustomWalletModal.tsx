"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
export function CustomWalletModal() {
  const { wallets, select } = useWallet();
  const { visible, setVisible } = useWalletModal();

  if (!visible) return null;

  const installedWallets = wallets.filter((w) => w.readyState === "Installed");
  const otherWallets = wallets.filter((w) => w.readyState !== "Installed");

  const handleSelect = (walletName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select(walletName as any);
    setVisible(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[300] bg-surface/80 backdrop-blur-sm" onClick={() => setVisible(false)} />

      {/* Modal */}
      <div className="fixed inset-0 z-[301] flex items-center justify-center px-4">
        <div className="w-full max-w-[400px] rounded-xl bg-surface-container p-6 relative" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
          {/* Close button */}
          <button onClick={() => setVisible(false)} className="absolute top-4 right-4 text-text-muted hover:text-on-surface transition-colors cursor-pointer text-lg">&times;</button>

          {/* Header with raider */}
          <div className="flex items-center gap-4 mb-5">
            { }
            <img src="/images/ui/state_no_wallet.webp" alt="" width={64} height={64} className="rounded-xl" />
            <div>
              <h2 className="font-display text-[18px] font-black text-on-surface">Connect Wallet</h2>
              <p className="font-mono text-[11px] text-on-surface-variant">Choose a wallet to start playing</p>
            </div>
          </div>

          {/* Installed wallets */}
          {installedWallets.length > 0 && (
            <div className="space-y-2 mb-4">
              {installedWallets.map((wallet) => (
                <button
                  key={wallet.adapter.name}
                  onClick={() => handleSelect(wallet.adapter.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-lowest hover:bg-surface-bright/50 transition-all cursor-pointer"
                >
                  { }
                  <img src={wallet.adapter.icon} alt="" width={32} height={32} className="rounded-md" />
                  <div className="flex-1 text-left">
                    <p className="font-display text-[13px] font-bold text-on-surface">{wallet.adapter.name}</p>
                    <p className="font-mono text-[10px] text-primary">Detected</p>
                  </div>
                  <span className="font-display text-[12px] font-bold text-primary">Connect</span>
                </button>
              ))}
            </div>
          )}

          {/* Other wallets */}
          {otherWallets.length > 0 && (
            <>
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-[0.1em] mb-2">Other wallets</p>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {otherWallets.slice(0, 6).map((wallet) => (
                  <button
                    key={wallet.adapter.name}
                    onClick={() => handleSelect(wallet.adapter.name)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-surface-bright/30 transition-all cursor-pointer"
                  >
                    { }
                    <img src={wallet.adapter.icon} alt="" width={24} height={24} className="rounded-md" />
                    <span className="font-display text-[12px] font-bold text-on-surface-variant">{wallet.adapter.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          <p className="font-mono text-[9px] text-text-ghost text-center mt-4">
            By connecting, you accept the <a href="/terms" className="text-primary hover:text-primary/80">Terms of Service</a>
          </p>
        </div>
      </div>
    </>
  );
}
