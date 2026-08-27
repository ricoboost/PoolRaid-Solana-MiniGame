"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSoundUI } from "@/hooks/useSound";

export function MobileBottomNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { muted, setMuted } = useSoundUI();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Bottom nav bar — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-surface-container/95 backdrop-blur-xl border-t border-surface-bright/20">
        <div className="flex items-center justify-around h-14">
          {/* Scratch */}
          <a
            href="/"
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all ${
              isActive("/") ? "text-primary" : "text-text-muted"
            }`}
          >
            { }
            <img src="/images/brand/logo_head_front.webp" alt="" width={22} height={22} className={`rounded ${isActive("/") ? "" : "opacity-50"}`} />
            <span className="font-mono text-[9px] font-bold">Scratch</span>
          </a>

          {/* Coin Flip */}
          <a
            href="/flip"
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all ${
              isActive("/flip") ? "text-primary" : "text-text-muted"
            }`}
          >
            { }
            <img src="/images/ui/coin_head.webp" alt="" width={22} height={22} className={`rounded-full ${isActive("/flip") ? "" : "opacity-50"}`} />
            <span className="font-mono text-[9px] font-bold">Flip</span>
          </a>

          {/* Sound */}
          <button
            onClick={() => setMuted(!muted)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all cursor-pointer ${muted ? "text-text-muted" : "text-primary"}`}
          >
            {muted ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4z" />
                <line x1="22" y1="9" x2="16" y2="15" />
                <line x1="16" y1="9" x2="22" y2="15" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5 6 9H2v6h4l5 4z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
            <span className="font-mono text-[9px] font-bold">{muted ? "Muted" : "Sound"}</span>
          </button>

          {/* Menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              menuOpen ? "text-primary" : "text-text-muted"
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
            <span className="font-mono text-[9px] font-bold">Menu</span>
          </button>
        </div>
      </nav>

      {/* Slide-up menu panel */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-surface/60 backdrop-blur-sm md:hidden" onClick={() => setMenuOpen(false)} />
          <div className="fixed bottom-14 left-0 right-0 z-45 md:hidden bg-surface-container rounded-t-2xl border-t border-surface-bright/20 p-4 space-y-1" style={{ boxShadow: "0 -8px 30px rgba(0,0,0,0.4)" }}>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-text-ghost px-2 mb-2">Navigate</p>

            <MenuLink href="/rules" label="Rules & Odds" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M12 2v4"/><path d="M16 2v4"/><rect width="16" height="18" x="4" y="4" rx="2"/><path d="M8 10h6"/><path d="M8 14h8"/><path d="M8 18h5"/></svg>} onClick={() => setMenuOpen(false)} />

            <MenuLink href="/leaderboard" label="Leaderboard" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"/><path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"/><path d="M18 9h1.5a1 1 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6 9H4.5a1 1 0 0 1 0-5H6"/></svg>} onClick={() => setMenuOpen(false)} />

            <MenuLink href="/responsible-gaming" label="Play Responsibly" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>} onClick={() => setMenuOpen(false)} />

            <div className="pt-2 mt-2 border-t border-surface-bright/20 flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <a href="/terms" className="font-mono text-[9px] text-text-ghost hover:text-on-surface-variant transition-colors" onClick={() => setMenuOpen(false)}>Terms</a>
                <a href="/privacy" className="font-mono text-[9px] text-text-ghost hover:text-on-surface-variant transition-colors" onClick={() => setMenuOpen(false)}>Privacy</a>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-bold bg-surface-bright/50 text-text-muted">18+</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MenuLink({ href, label, icon, onClick }: { href: string; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-surface-bright/50 transition-all"
    >
      <span className="text-text-muted">{icon}</span>
      <span className="font-display text-[13px] font-bold text-on-surface-variant">{label}</span>
    </a>
  );
}
