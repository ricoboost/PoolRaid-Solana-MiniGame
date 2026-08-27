"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const COOKIE_NAME = "poolraid_accepted";
const COOKIE_DAYS = 90;
const LEGAL_PATHS = ["/terms", "/privacy", "/responsible-gaming", "/blocked", "/rules"];

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function EntryGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAccepted(!!getCookie(COOKIE_NAME));
  }, []);

  if (LEGAL_PATHS.some((p) => pathname.startsWith(p))) return <>{children}</>;
  if (accepted === null) return null;
  if (accepted) return <>{children}</>;

  const handleAccept = () => {
    setCookie(COOKIE_NAME, new Date().toISOString(), COOKIE_DAYS);
    setAccepted(true);
  };

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] px-4">
        <div className="w-full max-w-[380px] rounded-xl p-6 text-center border border-white/10" style={{ background: "#141414", boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px var(--glow-primary)" }}>
          <Image src="/images/brand/logo_head_front.webp" alt="PoolRaid" width={48} height={48} className="mx-auto mb-4 rounded-xl" />
          <p className="font-display text-lg font-bold text-on-surface mb-1">
            Welcome to <span className="text-primary">PoolRaid</span>
          </p>
          <p className="font-mono text-[9px] text-text-muted mb-6">Provably fair scratch & flip games on Solana</p>

          <label className="flex items-start gap-3 text-left cursor-pointer mb-5 px-2">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-primary cursor-pointer flex-shrink-0" />
            <span className="font-body text-[11px] text-on-surface-variant leading-relaxed">
              I confirm I&apos;m 18+ and accept the{" "}
              <a href="/terms" target="_blank" className="text-primary hover:text-primary/80 underline">Terms of Service</a>
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!checked}
            className="w-full py-3 rounded-lg font-display text-[13px] font-extrabold uppercase tracking-[0.08em] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #34fea0, #2bcc80)",
              color: "#0a0a0a",
              boxShadow: checked ? "0 4px 20px rgba(52, 254, 160, 0.4)" : "none",
            }}
          >
            Let&apos;s Raid
          </button>
          <p className="font-mono text-[8px] text-text-ghost mt-4">Play responsibly. Only wager what you can afford to lose.</p>
        </div>
      </div>
    </>
  );
}
