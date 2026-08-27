export function Footer() {
  return (
    <footer className="mt-8 pb-6 pt-4 bg-surface-low">
      <div className="mx-auto max-w-[720px] px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          { }
          <img src="/images/ui/miniIconRaccoon.png" alt="" width={18} height={18} className="rounded-sm" />
          <p className="font-display text-[11px] font-bold text-text-muted">PoolRaid</p>
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-3 flex-wrap">
          <span className="px-1.5 py-0.5 rounded text-[7px] font-mono font-bold bg-surface-bright/50 text-text-muted">18+</span>
          <span className="font-mono text-[8px] text-text-ghost">&middot;</span>
          <span className="font-mono text-[8px] text-text-ghost">Provably Fair</span>
          <span className="font-mono text-[8px] text-text-ghost">&middot;</span>
        </div>
        <div className="flex items-center justify-center gap-3 mb-3">
          <a href="/terms" className="font-mono text-[8px] text-text-ghost hover:text-on-surface-variant transition-colors">Terms</a>
          <a href="/privacy" className="font-mono text-[8px] text-text-ghost hover:text-on-surface-variant transition-colors">Privacy</a>
          <a href="/responsible-gaming" className="font-mono text-[8px] text-text-ghost hover:text-on-surface-variant transition-colors">Play Responsibly</a>
          <a href="/rules" className="font-mono text-[8px] text-text-ghost hover:text-on-surface-variant transition-colors">Provably Fair</a>
        </div>
        <p className="font-mono text-[7px] text-text-ghost">PoolRaid open-source software · ISC License</p>
      </div>
    </footer>
  );
}
