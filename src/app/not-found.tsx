export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
      { }
      <img
        src="/images/ui/state_error.webp"
        alt=""
        width={280}
        height={280}
        className="mb-6"
      />
      <h1 className="font-display text-[28px] font-black text-on-surface mb-2">
        Are you lost??
      </h1>
      <p className="font-mono text-[13px] text-text-muted mb-8">
        This page doesn&apos;t exist. The raider is confused too.
      </p>
      <a
        href="/"
        className="px-8 py-3 rounded-xl font-display text-[13px] font-extrabold uppercase tracking-[0.08em] text-primary border-2 border-primary hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
      >
        Back to Home
      </a>
    </main>
  );
}
