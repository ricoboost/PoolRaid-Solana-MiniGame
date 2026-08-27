import { HistoryClient } from "./HistoryClient";

export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-[520px] min-h-screen px-4 py-6">
      <a href="/" className="flex items-center gap-2 mb-6">
        { }
        <img src="/images/ui/miniIconRaccoon.png" alt="" width={20} height={20} className="rounded-sm" />
        <span className="font-display text-lg font-black text-primary">PoolRaid</span>
      </a>
      <HistoryClient />
    </main>
  );
}
