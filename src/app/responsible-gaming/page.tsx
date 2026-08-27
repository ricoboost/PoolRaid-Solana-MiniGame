import { SelfExcludeClient } from "./SelfExcludeClient";

export default function ResponsibleGamingPage() {
  return (
    <main className="mx-auto max-w-[640px] min-h-screen px-4 py-8">
      <a href="/" className="flex items-center gap-2 mb-8">
        { }
        <img src="/images/ui/miniIconRaccoon.png" alt="" width={20} height={20} className="rounded-sm" />
        <span className="font-display text-lg font-black text-primary">PoolRaid</span>
      </a>

      <div className="mb-8">
        <h1 className="font-display text-2xl font-black text-on-surface mb-2">Play Responsibly</h1>
        <p className="font-body text-[13px] text-on-surface-variant leading-relaxed">
          PoolRaid is built for entertainment. We want every player to have fun while staying in control.
        </p>
      </div>

      {/* Know the Risks */}
      <div className="rounded-xl bg-surface-container p-5 mb-4">
        <h2 className="font-display text-[14px] font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-lose/10 flex items-center justify-center text-[11px]">!</span>
          Know the Risks
        </h2>
        <div className="space-y-2">
          <RiskItem text="All games on PoolRaid are games of chance. Outcomes are random and cryptographically determined." />
          <RiskItem text="Past results do not influence future outcomes. Each game is independent." />
          <RiskItem text="No strategy can guarantee winning. The platform has a built-in fee structure." />
          <RiskItem text="Only play with funds you can afford to lose entirely." />
        </div>
      </div>

      {/* Set Your Limits */}
      <div className="rounded-xl bg-surface-container p-5 mb-4">
        <h2 className="font-display text-[14px] font-bold text-on-surface mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[11px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </span>
          Set Your Limits
        </h2>
        <p className="font-body text-[12px] text-on-surface-variant mb-3">Before you play, decide on your boundaries:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <LimitCard title="Budget" desc="Set a maximum amount of SOL you are willing to spend this session." />
          <LimitCard title="Time" desc="Decide how long you want to play. We show session reminders after 60 minutes." />
          <LimitCard title="Loss Limit" desc="Pick a number. If your losses reach it, stop playing and come back another day." />
        </div>
      </div>

      {/* Warning Signs */}
      <div className="rounded-xl bg-lose/[0.04] border border-lose/10 p-5 mb-4">
        <h2 className="font-display text-[14px] font-bold text-on-surface mb-3">Warning Signs</h2>
        <p className="font-body text-[12px] text-on-surface-variant mb-3">Gaming may be becoming a problem if you:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          <WarningItem text="Spend more than you can afford" />
          <WarningItem text="Chase losses by continuing to play" />
          <WarningItem text="Neglect responsibilities due to gaming" />
          <WarningItem text="Feel anxious or restless when not playing" />
          <WarningItem text="Borrow money to fund gaming" />
          <WarningItem text="Hide how much you play or spend" />
        </div>
        <p className="font-body text-[11px] text-on-surface-variant mt-3">If any of these apply to you, please consider using our self-exclusion tool below or reaching out to a support resource.</p>
      </div>

      {/* Self-Exclusion */}
      <div className="rounded-xl bg-surface-container p-5 mb-4">
        <h2 className="font-display text-[14px] font-bold text-on-surface mb-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </span>
          Self-Exclusion
        </h2>
        <p className="font-body text-[12px] text-on-surface-variant mb-4">
          Need a break? Exclude your wallet from PoolRaid. During exclusion, you cannot buy tickets, join coin flips, or claim winnings.
        </p>
        <SelfExcludeClient />
      </div>

      {/* Resources */}
      <div className="rounded-xl bg-surface-container p-5 mb-4">
        <h2 className="font-display text-[14px] font-bold text-on-surface mb-3">Support Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <ResourceLink name="Gamblers Anonymous" url="https://www.gamblersanonymous.org" desc="Peer support community" />
          <ResourceLink name="National Council on Problem Gambling" url="https://www.ncpgambling.org" desc="US helpline: 1-800-522-4700" />
          <ResourceLink name="GamCare" url="https://www.gamcare.org.uk" desc="UK support and advice" />
          <ResourceLink name="Gambling Therapy" url="https://www.gamblingtherapy.org" desc="Free online support worldwide" />
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-xl bg-surface-container p-5 mb-8">
        <h2 className="font-display text-[14px] font-bold text-on-surface mb-2">Need Help?</h2>
        <p className="font-body text-[12px] text-on-surface-variant">
          For account or exclusion questions, contact the operator of the deployment you used. For immediate help, use a recognized gambling-support service in your jurisdiction.
        </p>
      </div>
    </main>
  );
}

function RiskItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-1.5 h-1.5 rounded-full bg-lose/40 mt-1.5 flex-shrink-0" />
      <p className="font-body text-[12px] text-on-surface-variant">{text}</p>
    </div>
  );
}

function LimitCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-3 rounded-lg bg-surface-lowest">
      <p className="font-display text-[12px] font-bold text-primary mb-1">{title}</p>
      <p className="font-mono text-[10px] text-on-surface-variant">{desc}</p>
    </div>
  );
}

function WarningItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-surface-container">
      <span className="w-1.5 h-1.5 rounded-full bg-lose/50 flex-shrink-0" />
      <p className="font-mono text-[11px] text-on-surface-variant">{text}</p>
    </div>
  );
}

function ResourceLink({ name, url, desc }: { name: string; url: string; desc: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-lg bg-surface-lowest hover:bg-surface-bright/30 transition-all">
      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </span>
      <div>
        <p className="font-display text-[12px] font-bold text-on-surface">{name}</p>
        <p className="font-mono text-[10px] text-text-muted">{desc}</p>
      </div>
    </a>
  );
}
