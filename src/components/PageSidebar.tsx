import Image from "next/image";

export function PageSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-[calc(100vh-3.5rem)] sticky top-14 bg-surface-low overflow-y-auto">
      <div className="flex-1 px-3 pt-4">
        <p className="px-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted mb-2">Quick Links</p>
        <div className="space-y-1">
          <SidebarLink href="/" icon="/images/brand/logo_head_front.webp" label="PoolRaid Scratch" primary />
          <SidebarLink href="/flip" iconSrc="/images/ui/coin_head.webp" label="Coin Flip" round />
          <SidebarLink href="/leaderboard" label="Leaderboard" svgIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978"/><path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978"/><path d="M18 9h1.5a1 1 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6 9H4.5a1 1 0 0 1 0-5H6"/></svg>} />
          <SidebarLink href="/rules" label="Rules & Odds" svgIcon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><path d="M8 2v4"/><path d="M12 2v4"/><path d="M16 2v4"/><rect width="16" height="18" x="4" y="4" rx="2"/><path d="M8 10h6"/><path d="M8 14h8"/><path d="M8 18h5"/></svg>} />
        </div>
      </div>
      <div className="flex justify-center mt-auto">
        <Image src="/images/ui/raider_body_leaning.webp" alt="" width={200} height={280} className="w-full h-auto" />
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, iconSrc, label, primary, round, svgIcon }: { href: string; icon?: string; iconSrc?: string; label: string; primary?: boolean; round?: boolean; svgIcon?: React.ReactNode }) {
  const imgSrc = icon || iconSrc;
  return (
    <a href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${primary ? "bg-primary-container/40 hover:bg-primary-container/60" : "hover:bg-surface-bright/50"}`}>
      {imgSrc ? (
        <Image src={imgSrc} alt="" width={24} height={24} className={round ? "rounded-full" : "rounded-md"} />
      ) : svgIcon ? (
        <span className="w-6 h-6 rounded-md bg-surface-bright/50 flex items-center justify-center">{svgIcon}</span>
      ) : (
        <span className="w-6 h-6 rounded-md bg-surface-bright/50 flex items-center justify-center text-[10px] text-text-muted">{label[0]}</span>
      )}
      <span className={`font-display text-[12px] font-bold ${primary ? "text-primary" : "text-on-surface-variant"}`}>{label}</span>
    </a>
  );
}
