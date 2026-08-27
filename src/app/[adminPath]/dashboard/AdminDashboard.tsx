"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatSOL } from "@/lib/utils";
import { TIERS } from "@/lib/tiers";

interface DashboardData {
  hotWallet: { address: string; balance: number };
  houseProfit: { unclaimed: number };
  pools: { tier: string; balance: number; ticketCount: number; totalIn: number; totalOut: number }[];
  today: { ticketsSold: number; volume: number; payouts: number; houseProfit: number; uniqueWallets: number; freeTickets: number; poolRaids: number; biggestWin: { amount: number; tier: string; type: string; wallet: string } };
  recentPayouts: { id: string; time: string; wallet: string; tier: string; type: string; amount: number; tx: string | null }[];
  flagged: { time: string; wallet: string; amount: number; reason: string }[];
  flipStats: { totalFlips: number; totalVolume: number; totalRake: number };
  systemStatus: { salesPaused: boolean; pausedTiers: string[]; dbHealth: string; rateLimitTableSize: number; hotWalletLow: boolean };
}

export function AdminDashboard({ adminPath }: { adminPath: string }) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Giveaway form
  const [giveWallet, setGiveWallet] = useState("");
  const [giveTier, setGiveTier] = useState("micro");
  const [giveCount, setGiveCount] = useState("1");
  const [giveStatus, setGiveStatus] = useState("");

  // Withdraw form
  const [withdrawWallet, setWithdrawWallet] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawStatus, setWithdrawStatus] = useState("");

  // Seed pool form
  const [seedTier, setSeedTier] = useState("micro");
  const [seedAmount, setSeedAmount] = useState("");
  const [seedStatus, setSeedStatus] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.status === 403) { router.push(`/${adminPath}`); return; }
      if (res.ok) { setData(await res.json()); setLastRefresh(new Date()); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [adminPath, router]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30_000); return () => clearInterval(i); }, [fetchData]);

  const handlePause = async (action: string, tier?: string) => {
    await fetch("/api/admin/pause", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, tier }) });
    fetchData();
  };

  const handleGiveaway = async () => {
    setGiveStatus("Sending...");
    const res = await fetch("/api/admin/giveaway", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress: giveWallet, tier: giveTier, count: parseInt(giveCount) }) });
    const d = await res.json();
    setGiveStatus(res.ok ? `Sent ${d.count} ${d.tier} tickets` : d.error);
    if (res.ok) { setGiveWallet(""); setGiveCount("1"); }
    fetchData();
  };

  const handleWithdraw = async () => {
    setWithdrawStatus("Processing...");
    const res = await fetch("/api/admin/withdraw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destinationWallet: withdrawWallet, amount: withdrawAmount }) });
    const d = await res.json();
    setWithdrawStatus(res.ok ? `Sent ${d.amount} SOL — tx: ${d.tx?.slice(0, 20)}...` : d.error);
    if (res.ok) { setWithdrawWallet(""); setWithdrawAmount(""); }
    fetchData();
  };

  const handleSeedPool = async () => {
    if (!seedAmount || parseFloat(seedAmount) <= 0) { setSeedStatus("Enter a valid amount"); return; }
    setSeedStatus("Seeding...");
    const res = await fetch("/api/admin/seed-pool", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier: seedTier, amount: seedAmount }) });
    const d = await res.json();
    setSeedStatus(res.ok ? `Seeded ${d.amount} SOL into ${d.tier}` : d.error);
    if (res.ok) setSeedAmount("");
    fetchData();
  };

  const disconnect = () => {
    document.cookie = "admin_token=; Path=/; Max-Age=0";
    router.push(`/${adminPath}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-surface"><p className="text-lose">Failed to load</p></div>;

  return (
    <main className="min-h-screen bg-surface">
      {/* Top bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-surface-container/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-lose/10 text-lose uppercase">Admin</span>
          <span className="font-display text-sm font-bold text-on-surface">PoolRaid</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-text-muted">Refreshed {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={disconnect} className="font-mono text-[11px] text-text-muted hover:text-lose cursor-pointer">Disconnect</button>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-6 py-6 space-y-6">
        {/* Hot Wallet + House Profit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Hot Wallet Balance">
            <p className="font-mono text-[10px] text-text-muted mb-1">{data.hotWallet.address}</p>
            <p className="font-display text-3xl font-black text-on-surface">{data.hotWallet.balance.toFixed(4)} <span className="text-text-muted text-sm">SOL</span></p>
          </Card>
          <Card title="House Profit">
            <p className="font-display text-3xl font-black text-primary">{formatSOL(data.houseProfit.unclaimed)} <span className="text-text-muted text-sm">SOL</span></p>
            <div className="flex gap-2 mt-3">
              <input value={withdrawWallet} onChange={(e) => setWithdrawWallet(e.target.value)} placeholder="Cold wallet address" className="flex-1 px-2 py-1.5 rounded-md bg-surface-highest font-mono text-[11px] text-on-surface outline-none" />
              <input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="SOL" className="w-20 px-2 py-1.5 rounded-md bg-surface-highest font-mono text-[11px] text-on-surface outline-none" />
              <button onClick={handleWithdraw} className="px-3 py-1.5 rounded-md bg-primary/10 font-mono text-[11px] font-bold text-primary cursor-pointer">Withdraw</button>
            </div>
            {withdrawStatus && <p className="font-mono text-[10px] text-text-muted mt-1">{withdrawStatus}</p>}
          </Card>
        </div>

        {/* Pool Balances */}
        <Card title="Pool Balances">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {data.pools.map((p) => (
              <div key={p.tier} className="rounded-lg bg-surface-lowest p-3 text-center">
                <p className="font-display text-[12px] font-bold text-on-surface capitalize">{p.tier}</p>
                <p className="font-display text-lg font-black text-primary">{formatSOL(p.balance)}</p>
                <p className="font-mono text-[10px] text-text-muted">{p.ticketCount} tickets</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Today's Stats */}
        <Card title="Today's Stats">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Tickets Sold" value={String(data.today.ticketsSold)} />
            <Stat label="Volume" value={`${formatSOL(data.today.volume)} SOL`} />
            <Stat label="Payouts" value={`${formatSOL(data.today.payouts)} SOL`} />
            <Stat label="House Profit" value={`${formatSOL(data.today.houseProfit)} SOL`} color="text-primary" />
            <Stat label="Unique Wallets" value={String(data.today.uniqueWallets)} />
            <Stat label="Free Tickets" value={String(data.today.freeTickets)} />
            <Stat label="Pool Raids" value={String(data.today.poolRaids)} />
            <Stat label="Biggest Win" value={data.today.biggestWin.amount > 0 ? `${formatSOL(data.today.biggestWin.amount)} SOL` : "—"} sub={data.today.biggestWin.tier} />
          </div>
        </Card>

        {/* Flip Stats */}
        <Card title="Coin Flip Stats">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Stat label="Total Flips" value={String(data.flipStats.totalFlips)} />
            <Stat label="Total Volume" value={`${formatSOL(data.flipStats.totalVolume)} SOL`} />
            <Stat label="Flip Rake" value={`${formatSOL(data.flipStats.totalRake)} SOL`} color="text-primary" />
          </div>
        </Card>

        {/* System Health */}
        <Card title="System Health">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`rounded-lg p-3 ${data.systemStatus.dbHealth === "ok" ? "bg-primary/[0.06]" : "bg-lose/[0.06]"}`}>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Database</p>
              <p className={`font-display text-[15px] font-extrabold ${data.systemStatus.dbHealth === "ok" ? "text-primary" : "text-lose"}`}>
                {data.systemStatus.dbHealth === "ok" ? "Healthy" : "Error"}
              </p>
            </div>
            <div className={`rounded-lg p-3 ${data.systemStatus.hotWalletLow ? "bg-lose/[0.06]" : "bg-primary/[0.06]"}`}>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Hot Wallet</p>
              <p className={`font-display text-[15px] font-extrabold ${data.systemStatus.hotWalletLow ? "text-lose" : "text-primary"}`}>
                {data.systemStatus.hotWalletLow ? "Low Balance" : "OK"}
              </p>
            </div>
            <Stat label="Rate Limit Table" value={String(data.systemStatus.rateLimitTableSize)} sub={data.systemStatus.rateLimitTableSize > 10000 ? "Needs cleanup" : "Normal"} />
            <div className={`rounded-lg p-3 ${data.systemStatus.salesPaused ? "bg-lose/[0.06]" : "bg-primary/[0.06]"}`}>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Sales</p>
              <p className={`font-display text-[15px] font-extrabold ${data.systemStatus.salesPaused ? "text-lose" : "text-primary"}`}>
                {data.systemStatus.salesPaused ? "Paused" : "Active"}
              </p>
            </div>
          </div>
        </Card>

        {/* Recent Payouts */}
        <Card title={`Recent Payouts (${data.recentPayouts.length})`}>
          <div className="max-h-[300px] overflow-y-auto rounded-lg">
            {data.recentPayouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 border-b border-surface-bright/10 last:border-b-0">
                <div>
                  <span className="font-mono text-[11px] text-on-surface-variant">{p.wallet}</span>
                  <span className="font-mono text-[10px] text-text-muted ml-2">{p.tier} · {p.type}</span>
                  {p.tx && (
                    <a
                      href={`https://solscan.io/tx/${p.tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[9px] text-primary hover:text-primary/80 ml-2"
                    >
                      tx &rarr;
                    </a>
                  )}
                </div>
                <span className="font-display text-[12px] font-bold text-primary">+{formatSOL(p.amount)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Flagged */}
        {data.flagged.length > 0 && (
          <Card title={`Flagged Transactions (${data.flagged.length})`}>
            {data.flagged.map((f, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-lose/[0.04] rounded-lg mb-1">
                <div>
                  <span className="font-mono text-[11px] text-on-surface">{f.wallet}</span>
                  <span className="font-mono text-[10px] text-lose ml-2">{f.reason}</span>
                </div>
                <span className="font-display text-[12px] font-bold text-lose">{formatSOL(f.amount)} SOL</span>
              </div>
            ))}
          </Card>
        )}

        {/* Controls */}
        <Card title="Controls">
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => handlePause("pause_all")} className="px-4 py-2 rounded-lg bg-lose/10 font-mono text-[11px] font-bold text-lose cursor-pointer">Pause All Sales</button>
            <button onClick={() => handlePause("resume_all")} className="px-4 py-2 rounded-lg bg-primary/10 font-mono text-[11px] font-bold text-primary cursor-pointer">Resume All</button>
          </div>
          {data.systemStatus.pausedTiers.length > 0 && (
            <p className="font-mono text-[11px] text-lose mb-3">Paused: {data.systemStatus.pausedTiers.join(", ")}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {TIERS.map((t) => {
              const isPaused = data.systemStatus.pausedTiers.includes(t.tier);
              return (
                <button key={t.tier} onClick={() => handlePause(isPaused ? "resume_tier" : "pause_tier", t.tier)}
                  className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-bold cursor-pointer ${isPaused ? "bg-lose/10 text-lose" : "bg-surface-lowest text-on-surface-variant hover:bg-surface-bright/50"}`}>
                  {t.label} {isPaused ? "▶ Resume" : "⏸ Pause"}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Giveaway */}
        <Card title="Giveaway Tool">
          <div className="flex flex-wrap gap-2">
            <input value={giveWallet} onChange={(e) => setGiveWallet(e.target.value)} placeholder="Wallet address" className="flex-1 min-w-[200px] px-3 py-2 rounded-md bg-surface-highest font-mono text-[11px] text-on-surface outline-none" />
            <select value={giveTier} onChange={(e) => setGiveTier(e.target.value)} className="px-3 py-2 rounded-md bg-surface-highest font-mono text-[11px] text-on-surface outline-none cursor-pointer">
              {TIERS.map((t) => <option key={t.tier} value={t.tier}>{t.label}</option>)}
            </select>
            <input value={giveCount} onChange={(e) => setGiveCount(e.target.value)} placeholder="Count" className="w-16 px-3 py-2 rounded-md bg-surface-highest font-mono text-[11px] text-on-surface outline-none" />
            <button onClick={handleGiveaway} className="px-4 py-2 rounded-md bg-primary/10 font-mono text-[11px] font-bold text-primary cursor-pointer">Send</button>
          </div>
          {giveStatus && <p className="font-mono text-[10px] text-text-muted mt-2">{giveStatus}</p>}
        </Card>

        {/* Seed Pool */}
        <Card title="Seed Pool">
          <p className="font-mono text-[10px] text-text-muted mb-3">
            Allocate SOL from the hot wallet to a tier&apos;s prize pool. Funds stay in the hot wallet but are credited to the pool balance.
          </p>
          <div className="flex flex-wrap gap-2">
            <select value={seedTier} onChange={(e) => setSeedTier(e.target.value)} className="px-3 py-2 rounded-md bg-surface-highest font-mono text-[11px] text-on-surface outline-none cursor-pointer">
              {TIERS.map((t) => <option key={t.tier} value={t.tier}>{t.label} ({t.ticketPrice} SOL)</option>)}
            </select>
            <input value={seedAmount} onChange={(e) => setSeedAmount(e.target.value)} placeholder="Amount SOL" className="w-32 px-3 py-2 rounded-md bg-surface-highest font-mono text-[11px] text-on-surface outline-none" />
            <button onClick={handleSeedPool} className="px-4 py-2 rounded-md bg-primary/10 font-mono text-[11px] font-bold text-primary cursor-pointer">Seed Pool</button>
          </div>
          {seedStatus && <p className="font-mono text-[10px] text-text-muted mt-2">{seedStatus}</p>}
        </Card>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-container p-5">
      <h2 className="font-display text-[14px] font-bold text-on-surface mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg bg-surface-lowest p-3">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">{label}</p>
      <p className={`font-display text-[15px] font-extrabold ${color || "text-on-surface"}`}>{value}</p>
      {sub && <p className="font-mono text-[9px] text-text-ghost">{sub}</p>}
    </div>
  );
}
