"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useWalletSession } from "@/hooks/useWalletSession";

export function AdminLogin({ adminPath }: { adminPath: string }) {
  const { publicKey, connected } = useWallet();
  const { ensureSession } = useWalletSession();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "signing" | "error">("idle");
  const [error, setError] = useState("");

  const authenticate = async () => {
    if (!publicKey) return;

    setStatus("signing");
    setError("");

    try {
      await ensureSession("admin");
      router.push(`/${adminPath}/dashboard`);
    } catch {
      setStatus("error");
      setError("Authentication failed.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-[380px] rounded-xl p-6 bg-surface-container text-center">
        <Image src="/images/brand/logo_head_front.webp" alt="PoolRaid" width={48} height={48} className="mx-auto mb-4 rounded-xl" />
        <p className="font-display text-lg font-bold text-on-surface mb-1">Admin Access</p>
        <p className="font-mono text-[11px] text-text-muted mb-6">Connect your wallet to authenticate</p>

        {!connected ? (
          <button
            onClick={() => setVisible(true)}
            className="w-full py-3 rounded-lg font-display text-[13px] font-extrabold uppercase tracking-[0.08em] text-on-primary cursor-pointer"
            style={{ background: "linear-gradient(135deg, #2be88e, #34fea0 50%, #2be88e)" }}
          >
            Connect Wallet
          </button>
        ) : status === "idle" ? (
          <button
            onClick={authenticate}
            className="w-full py-3 rounded-lg font-display text-[13px] font-extrabold uppercase tracking-[0.08em] text-on-primary cursor-pointer"
            style={{ background: "linear-gradient(135deg, #2be88e, #34fea0 50%, #2be88e)" }}
          >
            Authenticate
          </button>
        ) : status === "signing" ? (
          <div className="py-3">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
            <p className="font-mono text-[11px] text-text-muted">Signing challenge...</p>
          </div>
        ) : null}

        {error && (
          <p className="font-mono text-[11px] text-lose mt-4">{error}</p>
        )}
      </div>
    </main>
  );
}
