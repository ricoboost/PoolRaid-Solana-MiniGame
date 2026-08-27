"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { truncateWallet, formatSOL, timeAgo } from "@/lib/utils";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { getLevelForXp, getNextLevel } from "@/lib/xp";
import { getTierConfig, TIERS } from "@/lib/tiers";
import Image from "next/image";
import { invalidateAvatarCache } from "@/hooks/useAvatar";
import type { Tier, Zone1Result } from "@/types";
import { useWalletSession } from "@/hooks/useWalletSession";

interface FreeTicketInfo {
  id: string;
  tier: string;
  price: number;
  createdAt: string;
}

const AVATARS = ["Abase", "Acook", "Acyber", "Agirl", "Agolden", "Amystic", "Aneo", "Apirate", "Asensei", "Ashadow", "Asoldier", "Aspace"];

interface ProfileData {
  displayName: string | null;
  avatar: string | null;
  isPublic: boolean;
  currentStreak: number;
  bestStreak: number;
  totalXp: number;
  level: number;
  totalWagered: number;
  totalWon: number;
  winRate: number;
  totalTickets: number;
  winningTickets: number;
  achievements: { achievementId: string; unlockedAt: string }[];
  referralCode: string | null;
  referralCount: number;
  recentWins: { tier: string; totalPayout: number }[];
}

interface TicketRecord {
  id: string;
  tier: string;
  price: number;
  zone1Result: Zone1Result | null;
  totalPayout: number;
  payoutTx: string | null;
  status: string;
  isFreeTicket: boolean;
  createdAt: string;
}

interface FlipRecord {
  id: string;
  type: "flip";
  tier: number;
  amount: number;
  result: string;
  won: boolean;
  payout: number;
  payoutTx: string | null;
  opponent: string;
  side: string;
  completedAt: string;
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "history", label: "History" },
  { key: "rewards", label: "Rewards" },
  { key: "referral", label: "Referral" },
] as const;

export function ProfileClient({ wallet }: { wallet: string }) {
  const { publicKey } = useWallet();
  const isOwner = publicKey?.toBase58() === wallet;
  const [tab, setTab] = useState<string>("overview");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [flips, setFlips] = useState<FlipRecord[]>([]);
  const [historyTab, setHistoryTab] = useState<"scratch" | "flips">("scratch");
  const [freeTickets, setFreeTickets] = useState<FreeTicketInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeEditing, setCodeEditing] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeSaving, setCodeSaving] = useState(false);
  const [avatarPicker, setAvatarPicker] = useState(false);
  const { ensureSession } = useWalletSession();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      if (isOwner) await ensureSession();
      const requests = [
        fetch(`/api/player/profile?wallet=${wallet}&owner=${isOwner}`),
        fetch(`/api/player/history?wallet=${wallet}`),
        ...(isOwner ? [fetch("/api/tickets/available")] : []),
      ];
      const [profRes, histRes, freeRes] = await Promise.all(requests);
      if (profRes.ok) {
        const data = await profRes.json();
        setProfile(data);
        setNameInput(data.displayName || "");
      }
      if (histRes.ok) {
        const histData = await histRes.json();
        setTickets(histData.tickets || histData);
        setFlips(histData.flips || []);
      }
      if (freeRes.ok) setFreeTickets(await freeRes.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [wallet, isOwner, ensureSession]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const saveName = async () => {
    await ensureSession();
    await fetch("/api/player/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, ownerWallet: publicKey?.toBase58(), displayName: nameInput.trim() || null }),
    });
    setEditingName(false);
    fetchProfile();
  };

  const togglePublic = async () => {
    if (!profile) return;
    await ensureSession();
    await fetch("/api/player/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, ownerWallet: publicKey?.toBase58(), isPublic: !profile.isPublic }),
    });
    fetchProfile();
  };

  const claimTicket = async (ticketId: string) => {
    setClaimingId(ticketId);
    try {
      await ensureSession();
      const res = await fetch("/api/tickets/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, walletAddress: publicKey?.toBase58() }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error || "Claim failed"); }
      await fetchProfile();
    } catch { alert("Claim failed"); }
    finally { setClaimingId(null); }
  };

  const saveCode = async () => {
    const clean = codeInput.toLowerCase().trim();
    if (!/^[a-z0-9]{4,20}$/.test(clean)) { setCodeError("4-20 chars, letters & numbers only"); return; }
    setCodeSaving(true); setCodeError("");
    try {
      await ensureSession();
      const res = await fetch("/api/referral/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, ownerWallet: publicKey?.toBase58(), code: clean }),
      });
      if (!res.ok) { const d = await res.json(); setCodeError(d.error || "Failed"); return; }
      setCodeEditing(false);
      fetchProfile();
    } catch { setCodeError("Failed"); }
    finally { setCodeSaving(false); }
  };

  const saveAvatar = async (avatarName: string) => {
    await ensureSession();
    await fetch("/api/player/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, ownerWallet: publicKey?.toBase58(), avatar: avatarName }),
    });
    setAvatarPicker(false);
    invalidateAvatarCache(wallet);
    fetchProfile();
  };

  const currentAvatar = profile?.avatar || "Abase";

  if (!profile && !loading) {
    return (
      <div className="text-center py-16">
        <p className="font-display text-base font-bold text-text-muted">Player not found</p>
        <p className="font-mono text-[11px] text-text-ghost mt-1">{truncateWallet(wallet)}</p>
      </div>
    );
  }

  if (!isOwner && profile && !profile.isPublic) {
    return (
      <div className="text-center py-16">
        <p className="font-display text-base font-bold text-text-muted">{"\u{1F512}"} Private Profile</p>
        <p className="font-mono text-[11px] text-text-ghost mt-2">{truncateWallet(wallet)}</p>
      </div>
    );
  }

  if (loading || !profile) {
    return <div className="space-y-3 py-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-container animate-pulse" />)}</div>;
  }

  const levelDef = getLevelForXp(profile.totalXp);
  const nextLevel = getNextLevel(levelDef.level);
  const xpProgress = nextLevel ? ((profile.totalXp - levelDef.xpRequired) / (nextLevel.xpRequired - levelDef.xpRequired)) * 100 : 100;
  const pnl = (profile.totalWon ?? 0) - (profile.totalWagered ?? 0);

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
  const explorerSuffix = network === "mainnet-beta" ? "" : `?cluster=${network}`;

  const unclaimedTickets = tickets.filter((t) => t.status === "scratched" && t.totalPayout > 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            { }
            <img
              src={`/images/avatars/${currentAvatar}.webp`}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-surface-bright"
            />
            {isOwner && (
              <button
                onClick={() => setAvatarPicker(!avatarPicker)}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-surface-high border border-surface-bright flex items-center justify-center hover:bg-surface-bright transition-all cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-surface-variant"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
              </button>
            )}
          </div>
          <div>
            <p className="font-mono text-[11px] text-text-muted">{truncateWallet(wallet)}</p>
            {editingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} maxLength={20} className="px-2 py-1 rounded-md bg-surface-highest font-display text-sm font-bold text-on-surface outline-none focus:ring-1 focus:ring-primary/30 w-36" autoFocus />
                <button onClick={saveName} className="font-mono text-[11px] text-primary cursor-pointer">Save</button>
                <button onClick={() => setEditingName(false)} className="font-mono text-[11px] text-text-muted cursor-pointer">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-on-surface">{profile.displayName || `Player ${wallet.slice(0, 6)}`}</h1>
                {isOwner && <button onClick={() => setEditingName(true)} className="font-mono text-[11px] text-text-muted hover:text-primary cursor-pointer">edit</button>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {profile.isPublic && (
            <ShareMenu
              profileUrl={typeof window !== "undefined" ? `${window.location.origin}/profile/${wallet}` : ""}
              displayName={profile.displayName || `Player ${wallet.slice(0, 6)}`}
              stats={{ won: formatSOL(profile.totalWon), winRate: (profile.winRate ?? 0).toFixed(1), level: levelDef.name }}
            />
          )}
          {isOwner && (
            <button onClick={togglePublic} className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold uppercase tracking-[0.05em] transition-all cursor-pointer ${profile.isPublic ? "text-primary bg-primary/10" : "text-text-muted bg-surface-container"}`}>
              <span className="flex items-center gap-1.5">
                {profile.isPublic ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                )}
                {profile.isPublic ? "Public" : "Private"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Avatar picker */}
      {avatarPicker && isOwner && (
        <div className="mb-4 p-4 rounded-xl bg-surface-container">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-[13px] font-bold text-on-surface">Choose Avatar</p>
            <button onClick={() => setAvatarPicker(false)} className="font-mono text-[11px] text-text-muted hover:text-on-surface cursor-pointer">&times;</button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((av) => (
              <button
                key={av}
                onClick={() => saveAvatar(av)}
                className={`rounded-full overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
                  currentAvatar === av ? "border-primary" : "border-transparent hover:border-surface-bright"
                }`}
              >
                { }
                <img src={`/images/avatars/${av}.webp`} alt={av.slice(1)} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level bar */}
      <div className="flex items-center gap-3 mb-5">
        <span className="px-2 py-0.5 rounded-md bg-primary/10 font-mono text-[11px] font-bold text-primary">Lv.{levelDef.level} {levelDef.name}</span>
        <span className="font-mono text-[11px] text-text-muted">{profile.totalXp} XP</span>
        <div className="flex-1 h-1 rounded-full bg-surface-lowest overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary" style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg font-mono text-[11px] font-bold uppercase tracking-[0.05em] transition-all cursor-pointer ${tab === t.key ? "bg-primary/10 text-primary" : "text-text-muted bg-surface-container hover:text-on-surface-variant"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {tab === "overview" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5">
            <StatBox label="Wagered" value={`${formatSOL(profile.totalWagered)} SOL`} />
            <StatBox label="Won" value={`${formatSOL(profile.totalWon)} SOL`} color="text-primary" />
            <StatBox label="P&L" value={`${pnl >= 0 ? "+" : ""}${formatSOL(pnl)} SOL`} color={pnl >= 0 ? "text-primary" : "text-lose"} />
            <StatBox label="Win Rate" value={`${(profile.winRate ?? 0).toFixed(1)}%`} sub={`${profile.winningTickets ?? 0}/${profile.totalTickets ?? 0}`} />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <StatBox label="Best Streak" value={`${profile.bestStreak ?? 0}`} sub={`Current: ${profile.currentStreak ?? 0}`} />
            <StatBox label="Free Tickets" value={`${freeTickets.length} available`} sub={`${tickets.filter(t => t.isFreeTicket).length} total received`} />
          </div>

          {/* Achievements */}
          <h2 className="font-display text-[14px] font-bold text-on-surface mb-3">
            Achievements ({(profile.achievements ?? []).length}/{ACHIEVEMENTS.length})
          </h2>
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = (profile.achievements ?? []).some((u) => u.achievementId === a.id);
              return (
                <div key={a.id} className={`flex flex-col items-center gap-1 py-2.5 rounded-xl ${unlocked ? "bg-primary/[0.04]" : "bg-surface-container opacity-30"}`} title={`${a.name}: ${a.description}`}>
                  <span className="text-lg">{a.icon}</span>
                  <span className="font-mono text-[9px] font-bold text-on-surface-variant text-center leading-tight px-1">{a.name}</span>
                </div>
              );
            })}
          </div>

          {/* Recent wins */}
          {(profile.recentWins ?? []).length > 0 && (
            <>
              <h2 className="font-display text-[14px] font-bold text-on-surface mb-3">Recent Wins</h2>
              <div className="rounded-xl overflow-hidden mb-6">
                {(profile.recentWins ?? []).map((w, i) => (
                  <div key={i} className={`flex items-center justify-between py-2.5 px-4 ${i % 2 === 0 ? "bg-surface-container" : "bg-surface-lowest"}`}>
                    <span className="font-mono text-[12px] text-on-surface-variant">{w.tier}</span>
                    <span className="font-display text-[13px] font-extrabold text-primary">+{formatSOL(w.totalPayout)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ─── HISTORY TAB ─── */}
      {tab === "history" && (
        <>
          {/* Sub-tabs: Scratch / Flips */}
          <div className="flex gap-1.5 mb-4">
            <button onClick={() => setHistoryTab("scratch")} className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-[0.05em] transition-all cursor-pointer ${historyTab === "scratch" ? "bg-primary/10 text-primary" : "text-text-muted bg-surface-container hover:text-on-surface-variant"}`}>
              Scratch Cards ({tickets.length})
            </button>
            <button onClick={() => setHistoryTab("flips")} className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-[0.05em] transition-all cursor-pointer ${historyTab === "flips" ? "bg-primary/10 text-primary" : "text-text-muted bg-surface-container hover:text-on-surface-variant"}`}>
              Coin Flips ({flips.length})
            </button>
          </div>

          {/* Scratch Cards History */}
          {historyTab === "scratch" && (
            <>
              {/* Unclaimed banner */}
              {unclaimedTickets.length > 0 && (
                <div className="rounded-xl p-4 mb-5 bg-primary/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-sm font-bold text-primary">Unclaimed Winnings</span>
                    <span className="font-display text-lg font-black text-primary">
                      {formatSOL(unclaimedTickets.reduce((s, t) => s + t.totalPayout, 0))} SOL
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {unclaimedTickets.map((t) => {
                      const config = getTierConfig(t.tier as Tier);
                      return (
                        <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-lowest">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-[12px] font-bold text-on-surface">{config.label}</span>
                            <span className="font-mono text-[10px] text-text-muted">{t.isFreeTicket ? "FREE" : `${t.price} SOL`}</span>
                          </div>
                          <button onClick={() => claimTicket(t.id)} disabled={claimingId === t.id} className="px-3 py-1.5 rounded-lg font-display text-[11px] font-bold text-primary border border-primary/30 hover:border-primary/50 cursor-pointer disabled:opacity-50">
                            {claimingId === t.id ? "..." : `Claim ${formatSOL(t.totalPayout)}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tickets.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-surface-container">
                  <p className="font-mono text-[12px] text-text-muted">No scratch tickets yet</p>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
                  {tickets.map((t, i) => {
                    const config = getTierConfig(t.tier as Tier);
                    const isWin = t.totalPayout > 0;
                    const isPaid = t.status === "paid";
                    const isUnclaimed = t.status === "scratched" && isWin;
                    return (
                      <div key={t.id} className={`flex items-center justify-between py-2.5 px-4 ${i % 2 === 0 ? "bg-surface-container" : "bg-surface-lowest"} ${isUnclaimed ? "bg-primary/[0.03]" : ""}`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-display text-[12px] font-bold text-on-surface">{config.label}</span>
                              {t.isFreeTicket && <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-tertiary/10 text-tertiary uppercase">Free</span>}
                              {isUnclaimed && <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-primary/10 text-primary uppercase animate-pulse">Claim</span>}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-text-ghost">{timeAgo(t.createdAt)}</span>
                              {t.zone1Result && <span className="font-mono text-[10px] text-text-muted">{(t.zone1Result as Zone1Result).label}</span>}
                              {isPaid && t.payoutTx && <a href={`https://explorer.solana.com/tx/${t.payoutTx}${explorerSuffix}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-text-muted hover:text-primary">tx &rarr;</a>}
                            </div>
                          </div>
                        </div>
                        <span className={`font-display text-[13px] font-extrabold flex-shrink-0 ${isWin ? "text-primary" : "text-text-muted"}`}>
                          {isWin ? `+${formatSOL(t.totalPayout)}` : "0"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Coin Flips History */}
          {historyTab === "flips" && (
            <>
              {flips.length === 0 ? (
                <div className="text-center py-8 rounded-xl bg-surface-container">
                  <p className="font-mono text-[12px] text-text-muted">No coin flips yet</p>
                  <a href="/flip" className="font-mono text-[11px] text-primary hover:text-primary/80 mt-1 inline-block">Play Coin Flip &rarr;</a>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
                  {flips.map((f, i) => (
                    <div key={f.id} className={`flex items-center justify-between py-2.5 px-4 ${i % 2 === 0 ? "bg-surface-container" : "bg-surface-lowest"}`}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-[12px] font-bold text-on-surface">{formatSOL(f.tier)} SOL</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${f.won ? "bg-primary/10 text-primary" : "bg-lose/10 text-lose"}`}>
                            {f.won ? "Won" : "Lost"}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-surface-bright/50 text-text-muted uppercase">
                            {f.side}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-text-ghost">{timeAgo(f.completedAt)}</span>
                          <span className="font-mono text-[10px] text-text-muted">vs {truncateWallet(f.opponent)}</span>
                          <span className="font-mono text-[10px] text-text-ghost">&middot; {f.result}</span>
                          {f.payoutTx && <a href={`https://explorer.solana.com/tx/${f.payoutTx}${explorerSuffix}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-text-muted hover:text-primary">tx &rarr;</a>}
                        </div>
                      </div>
                      <span className={`font-display text-[13px] font-extrabold flex-shrink-0 ${f.won ? "text-primary" : "text-lose"}`}>
                        {f.won ? `+${formatSOL(f.payout)}` : `-${formatSOL(f.amount)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── REWARDS TAB ─── */}
      {tab === "rewards" && (
        <div>
          <h2 className="font-display text-[14px] font-bold text-on-surface mb-2">Free Tickets</h2>
          <p className="font-mono text-[11px] text-on-surface-variant mb-4">
            Free tickets from giveaways, referrals, and zone 3 wins. Select a tier on the home page to play them.
          </p>

          {freeTickets.length === 0 ? (
            <div className="text-center py-8 rounded-xl bg-surface-container">
              <p className="font-mono text-[12px] text-text-muted">No free tickets available</p>
              <p className="font-mono text-[10px] text-text-ghost mt-1">Win them from zone 3 or receive giveaways</p>
            </div>
          ) : (
            <>
              {/* Summary per tier */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-5">
                {TIERS.map((t) => {
                  const count = freeTickets.filter((ft) => ft.tier === t.tier).length;
                  if (count === 0) return null;
                  return (
                    <div key={t.tier} className="rounded-xl bg-surface-container p-3 flex items-center gap-3">
                      <Image src={`/images/tiers/${t.tier}_coin.webp`} alt={t.label} width={32} height={32} className="rounded-lg" />
                      <div>
                        <p className="font-display text-[13px] font-bold text-on-surface">{count}</p>
                        <p className="font-mono text-[10px] text-on-surface-variant">{t.label} · {t.ticketPrice} SOL</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full list */}
              <h3 className="font-display text-[13px] font-bold text-on-surface mb-2">All Available ({freeTickets.length})</h3>
              <div className="rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                {freeTickets.map((ft, i) => {
                  const config = getTierConfig(ft.tier as Tier);
                  return (
                    <div key={ft.id} className={`flex items-center justify-between py-2.5 px-4 ${i % 2 === 0 ? "bg-surface-container" : "bg-surface-lowest"}`}>
                      <div className="flex items-center gap-2.5">
                        <Image src={`/images/tiers/${ft.tier}_coin.webp`} alt={config.label} width={24} height={24} className="rounded-md" />
                        <div>
                          <span className="font-display text-[12px] font-bold text-on-surface">{config.label}</span>
                          <span className="font-mono text-[10px] text-text-muted ml-2">{config.ticketPrice} SOL value</span>
                        </div>
                      </div>
                      <a href="/" className="px-3 py-1.5 rounded-lg font-display text-[10px] font-bold text-primary border border-primary/30 hover:border-primary/50 cursor-pointer">
                        Play
                      </a>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Played free tickets history */}
          {tickets.filter(t => t.isFreeTicket && t.status !== "funded").length > 0 && (
            <div className="mt-6">
              <h3 className="font-display text-[13px] font-bold text-on-surface mb-2">
                Played ({tickets.filter(t => t.isFreeTicket && t.status !== "funded").length})
              </h3>
              <div className="rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                {tickets.filter(t => t.isFreeTicket && t.status !== "funded").map((t, i) => {
                  const config = getTierConfig(t.tier as Tier);
                  return (
                    <div key={t.id} className={`flex items-center justify-between py-2.5 px-4 ${i % 2 === 0 ? "bg-surface-container" : "bg-surface-lowest"}`}>
                      <div>
                        <span className="font-display text-[12px] font-bold text-on-surface-variant">{config.label}</span>
                        <span className="font-mono text-[10px] text-text-ghost ml-2">{timeAgo(t.createdAt)}</span>
                      </div>
                      <span className={`font-display text-[12px] font-extrabold ${t.totalPayout > 0 ? "text-primary" : "text-text-muted"}`}>
                        {t.totalPayout > 0 ? `+${formatSOL(t.totalPayout)}` : "0"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── REFERRAL TAB ─── */}
      {tab === "referral" && isOwner && (
        <div>
          <div className="lg:flex lg:gap-6">
            {/* Left — referral link + rules */}
            <div className="flex-1">
              <h2 className="font-display text-[14px] font-bold text-on-surface mb-2">Refer Friends, Earn Free Tickets</h2>
              <p className="font-mono text-[11px] text-on-surface-variant mb-5 leading-relaxed">
                Share your referral link. When a friend buys their first ticket, you automatically receive a free scratch ticket.
              </p>

              {profile.referralCode ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 px-3 py-2.5 rounded-lg bg-surface-highest font-mono text-[12px] text-on-surface-variant truncate">
                      {typeof window !== "undefined" ? window.location.origin : ""}/r/<span className="text-primary">{profile.referralCode}</span>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/r/${profile.referralCode}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-4 py-2.5 rounded-lg bg-primary/10 font-mono text-[11px] font-bold text-primary cursor-pointer flex-shrink-0">
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {codeEditing ? (
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center flex-1 rounded-lg bg-surface-highest overflow-hidden">
                          <span className="px-2 font-mono text-[11px] text-text-ghost">/r/</span>
                          <input value={codeInput} onChange={(e) => { setCodeInput(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "")); setCodeError(""); }} maxLength={20} placeholder="yourcode" className="flex-1 py-2 pr-3 bg-transparent font-mono text-[12px] text-on-surface outline-none" autoFocus />
                        </div>
                        <button onClick={saveCode} disabled={codeSaving} className="px-3 py-2 rounded-lg bg-primary/10 font-mono text-[11px] font-bold text-primary cursor-pointer disabled:opacity-50">{codeSaving ? "..." : "Save"}</button>
                        <button onClick={() => { setCodeEditing(false); setCodeError(""); }} className="px-2 py-2 font-mono text-[11px] text-text-muted cursor-pointer">Cancel</button>
                      </div>
                      {codeError && <p className="font-mono text-[10px] text-lose mt-1">{codeError}</p>}
                      <p className="font-mono text-[10px] text-text-ghost mt-1">4-20 characters, letters and numbers only</p>
                    </div>
                  ) : (
                    <button onClick={() => { setCodeEditing(true); setCodeInput(profile.referralCode || ""); }} className="px-4 py-2 rounded-lg font-mono text-[11px] font-bold text-primary border border-primary/30 hover:border-primary/50 hover:bg-primary/[0.04] transition-all cursor-pointer mb-5">
                      Customize code &rarr;
                    </button>
                  )}

                  {(profile.referralCount ?? 0) > 0 && (
                    <div className="rounded-xl bg-primary/[0.04] p-4 mb-5">
                      <p className="font-display text-[18px] font-black text-primary">{profile.referralCount}</p>
                      <p className="font-mono text-[11px] text-on-surface-variant">player{profile.referralCount > 1 ? "s" : ""} referred</p>
                    </div>
                  )}
                </>
              ) : (
                <button onClick={async () => { await fetch(`/api/referral/code?wallet=${wallet}`); fetchProfile(); }} className="w-full py-3 rounded-lg bg-primary/10 font-display text-[12px] font-bold text-primary cursor-pointer mb-5">
                  Generate Referral Link
                </button>
              )}

              {/* Rules */}
              <div className="rounded-xl bg-surface-container p-4 space-y-3">
                <h3 className="font-display text-[13px] font-bold text-on-surface">How it works</h3>
                <div className="space-y-2">
                  <Rule step="1" text="Share your referral link with friends" />
                  <Rule step="2" text="Your friend connects their wallet and buys their first ticket" />
                  <Rule step="3" text="You instantly receive a free ticket for the same tier they played" />
                </div>
                <div className="pt-2 space-y-1.5">
                  <p className="font-mono text-[10px] text-on-surface-variant">
                    <span className="text-primary font-bold">Tier matching:</span> If your friend plays Micro, you get a free Micro ticket. If they play Mini, you get Mini. Standard and above are capped at Standard.
                  </p>
                  <p className="font-mono text-[10px] text-on-surface-variant">
                    <span className="text-primary font-bold">Cap:</span> Free tickets from referrals are capped at <span className="text-on-surface font-semibold">Standard tier (0.1 SOL)</span> to prevent abuse. If your friend buys Gold, Diamond, or Black — you still get a Standard ticket.
                  </p>
                  <p className="font-mono text-[10px] text-on-surface-variant">
                    <span className="text-primary font-bold">One-time:</span> You earn a free ticket only on your friend&apos;s <span className="text-on-surface font-semibold">first ever purchase</span>. Subsequent purchases don&apos;t trigger rewards.
                  </p>
                  <p className="font-mono text-[10px] text-on-surface-variant">
                    <span className="text-primary font-bold">No self-referral:</span> You cannot refer your own wallet.
                  </p>
                </div>
              </div>
            </div>

            {/* Right — mascot (desktop only) */}
            <div className="hidden lg:flex items-end justify-center w-56 flex-shrink-0 self-stretch">
              <Image src="/images/ui/raider_body_holding_sol.webp" alt="Raider holding SOL" width={220} height={300} className="opacity-80 w-full h-auto" style={{ maxHeight: "100%", objectFit: "contain" }} />
            </div>
          </div>
        </div>
      )}

      {tab === "referral" && !isOwner && (
        <div className="text-center py-8">
          <p className="font-mono text-[12px] text-text-muted">Referral info is only visible to the profile owner.</p>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl bg-surface-container p-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted mb-1">{label}</p>
      <p className={`font-display text-[15px] font-extrabold ${color || "text-on-surface"}`}>{value}</p>
      {sub && <p className="font-mono text-[10px] text-text-ghost mt-0.5">{sub}</p>}
    </div>
  );
}

function ShareMenu({ profileUrl, displayName, stats }: { profileUrl: string; displayName: string; stats: { won: string; winRate: string; level: string } }) {
  const [open, setOpen] = useState(false);

  const shareText = `${displayName} on PoolRaid \u{1F3B0}\n${stats.won} SOL won \u00b7 ${stats.winRate}% win rate \u00b7 ${stats.level}\n${profileUrl}`;

  const shareX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
    setOpen(false);
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
    setOpen(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold text-on-surface-variant bg-surface-container hover:bg-surface-bright/50 transition-all cursor-pointer"
      >
        Share
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-48 rounded-xl bg-surface-high p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <button onClick={shareX} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-bright/50 transition-all cursor-pointer text-left">
              <span className="w-5 text-center text-sm">𝕏</span>
              <span className="font-mono text-[11px] text-on-surface-variant">Share on X</span>
            </button>
            <button onClick={shareTelegram} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-bright/50 transition-all cursor-pointer text-left">
              <span className="w-5 text-center text-sm">{"\u{1F4E8}"}</span>
              <span className="font-mono text-[11px] text-on-surface-variant">Telegram</span>
            </button>
            <button onClick={copyLink} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-bright/50 transition-all cursor-pointer text-left">
              <span className="w-5 text-center text-sm">{"\u{1F517}"}</span>
              <span className="font-mono text-[11px] text-on-surface-variant">Copy Link</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Rule({ step, text }: { step: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="font-display text-[10px] font-bold text-primary">{step}</span>
      </span>
      <p className="font-mono text-[11px] text-on-surface-variant">{text}</p>
    </div>
  );
}
