export default function BlockedPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-surface">
      { }
      <img src="/images/ui/miniIconRaccoon.png" alt="" width={40} height={40} className="rounded-lg mb-6" />
      <h1 className="font-display text-2xl font-black text-on-surface mb-3">
        Not Available in Your Region
      </h1>
      <p className="font-body text-sm text-on-surface-variant max-w-md leading-relaxed mb-6">
        PoolRaid is not available in your country due to local regulations
        regarding online gaming. We respect the laws of your jurisdiction and
        have restricted access accordingly.
      </p>
      <p className="font-mono text-[10px] text-text-muted">
        If you believe this is an error, contact the operator of the deployment you used.
      </p>
      <div className="mt-8 flex gap-4">
        <a href="/terms" className="font-mono text-[9px] text-text-ghost hover:text-on-surface-variant transition-colors">Terms</a>
        <a href="/privacy" className="font-mono text-[9px] text-text-ghost hover:text-on-surface-variant transition-colors">Privacy</a>
      </div>
    </main>
  );
}
