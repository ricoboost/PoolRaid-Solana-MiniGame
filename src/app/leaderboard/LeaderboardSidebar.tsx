import Image from "next/image";
import { formatSOL } from "@/lib/utils";
import { ProfileLink } from "./ProfileLink";

interface Props {
  totalPool: number;
  totalTickets: number;
}

export function LeaderboardSidebar({ totalPool, totalTickets }: Props) {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-3.5rem)] sticky top-14 bg-surface-low overflow-y-auto">
      {/* Total Pool card */}
      <div className="m-3 mb-2 p-[1.5px] rounded-xl"
        style={{
          background: "linear-gradient(135deg, rgba(52,254,160,0.25), rgba(52,254,160,0.05) 40%, rgba(185,132,255,0.15) 100%)",
          boxShadow: "0 0 40px rgba(52,254,160,0.10), 0 8px 30px rgba(0,0,0,0.6)",
        }}
      >
        <div className="p-4 rounded-[10px] relative overflow-hidden" style={{ background: "linear-gradient(145deg, #1e1e1e 0%, #0e0e0e 50%, #151515 100%)" }}>
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(52,254,160,0.12) 0%, transparent 60%)" }} />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary/60 mb-1.5 relative z-10">Total Prize Pools</p>
          <p className="font-display text-[26px] font-black tracking-[-0.03em] text-on-surface leading-none relative z-10">
            {formatSOL(totalPool)} <span className="text-text-muted text-[12px]">SOL</span>
          </p>
          <p className="font-mono text-[10px] text-text-muted mt-1.5 relative z-10">{totalTickets} tickets scratched</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex-1 px-3 pt-2">
        <p className="px-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted mb-2">Quick Links</p>
        <div className="space-y-1">
          <SidebarLink href="/" icon="/images/brand/logo_head_front.webp" label="PoolRaid Scratch" primary />
          <SidebarLink href="/flip" icon="/images/ui/coin_head.webp" label="Coin Flip" />
          <SidebarLink href="/leaderboard" icon="" label="Leaderboard" svgIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"/><path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"/><path d="M18 9h1.5a1 1 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6 9H4.5a1 1 0 0 1 0-5H6"/></svg>} />
          <ProfileLink />
          <SidebarLink href="/rules" icon="" label="Rules & Odds" svgIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><path d="M8 2v4"/><path d="M12 2v4"/><path d="M16 2v4"/><rect width="16" height="18" x="4" y="4" rx="2"/><path d="M8 10h6"/><path d="M8 14h8"/><path d="M8 18h5"/></svg>} />
        </div>
      </div>

      {/* Raider */}
      <div className="flex justify-center mt-auto">
        <Image src="/images/ui/raider_body_leaning.webp" alt="" width={200} height={280} className="w-full h-auto" />
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label, primary, svgIcon }: { href: string; icon: string; label: string; primary?: boolean; svgIcon?: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
        primary
          ? "bg-primary-container/40 hover:bg-primary-container/60"
          : "hover:bg-surface-bright/50"
      }`}
    >
      {icon ? (
        <Image src={icon} alt="" width={24} height={24} className="rounded-md" />
      ) : svgIcon ? (
        <span className="w-6 h-6 rounded-md bg-surface-bright/50 flex items-center justify-center">{svgIcon}</span>
      ) : (
        <span className="w-6 h-6 rounded-md bg-surface-bright/50 flex items-center justify-center text-[10px] text-text-muted">{label[0]}</span>
      )}
      <span className={`font-display text-[12px] font-bold ${primary ? "text-primary" : "text-on-surface-variant"}`}>
        {label}
      </span>
    </a>
  );
}
