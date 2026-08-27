import { prisma } from "@/lib/prisma";
import { formatLamports } from "@/lib/utils";
import { TIERS } from "@/lib/tiers";
import { getRaidableBalance } from "@/lib/pool";
import { getBootstrapPhase, getHouseCutPct } from "@/lib/payout";
import { TicketVerifier } from "./TicketVerifier";
import { PageSidebar } from "@/components/PageSidebar";
import Image from "next/image";
import type { Tier } from "@/types";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const pools = await prisma.pool.findMany();
  const poolMap = new Map(pools.map((p) => [p.tier, p]));

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <PageSidebar />
      <main className="flex-1 px-4 lg:px-8 py-8 max-w-[900px] mx-auto w-full">
      <h1 className="font-display text-2xl font-black text-on-surface mb-1">How PoolRaid Works</h1>
      <p className="font-mono text-[12px] text-text-muted mb-8">
        Transparent odds. Provably fair. Every outcome verifiable on-chain.
      </p>

      {/* How it works */}
      <Section title="How to Play">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Step n={1} title="Pick your tier" desc="Choose from 6 tiers starting at just 0.001 SOL. Pay with your Phantom wallet — funds go directly to the prize pool." />
          <Step n={2} title="Scratch 3 zones" desc="Each zone gives you an independent chance to win. Scratch the coating to reveal multipliers, pool raids, and free tickets." />
          <Step n={3} title="Claim instantly" desc="Winnings are sent straight to your wallet as SOL. On-chain, instant, verifiable. No withdrawal delays." />
        </div>
      </Section>

      {/* Two games */}
      <Section title="Two Ways to Win">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-surface-container">
            <div className="flex items-center gap-2 mb-2">
              <Image src="/images/brand/logo_head_front.webp" alt="" width={24} height={24} className="rounded" />
              <span className="font-display text-[14px] font-bold text-on-surface">Scratch Cards</span>
            </div>
            <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed">
              Solo game. Buy a ticket, scratch 3 zones. Win multipliers on your ticket price, raid the prize pool, or earn free tickets. 80% of tickets return something.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-container">
            <div className="flex items-center gap-2 mb-2">
              { }
              <img src="/images/ui/coin_head.webp" alt="" width={24} height={24} className="rounded-full" />
              <span className="font-display text-[14px] font-bold text-on-surface">Coin Flip</span>
            </div>
            <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed">
              PVP game. Two players, one coin, 50/50 odds. Winner takes the pot minus a small 3% fee. Pick heads or tails, sit in a room, and flip.
            </p>
          </div>
        </div>
      </Section>

      {/* Scratch Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="font-display text-[15px] font-bold text-on-surface mb-2">Zone 1 — Instant Multiplier</h2>
          <p className="font-mono text-[11px] text-on-surface-variant mb-3">
            Win a multiple of your ticket price. 8 out of 10 tickets hit a payout.
          </p>
          <div className="rounded-xl bg-surface-container overflow-hidden">
            <div className="grid grid-cols-3 bg-surface-high">
              <TableHead>Result</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead>Chance</TableHead>
            </div>
            <OddsRow result="JACKPOT" mult="5x your ticket" chance="2%" highlight accent />
            <OddsRow result="Mega Win" mult="3x your ticket" chance="3%" highlight />
            <OddsRow result="Big Win" mult="2x your ticket" chance="5%" highlight />
            <OddsRow result="Win" mult="1.5x your ticket" chance="10%" highlight />
            <OddsRow result="Money Back" mult="1x (break even)" chance="15%" highlight />
            <OddsRow result="Half Back" mult="0.5x" chance="20%" highlight={false} />
            <OddsRow result="Quarter Back" mult="0.25x" chance="25%" highlight={false} />
            <OddsRow result="Miss" mult="—" chance="20%" highlight={false} />
          </div>
          <div className="mt-3 p-3 rounded-xl bg-primary/[0.04]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-on-surface-variant">Win rate</span>
              <span className="font-display text-sm font-bold text-primary">80%</span>
            </div>
            <p className="font-mono text-[10px] text-text-muted mt-1">4 out of 5 tickets return something to your wallet</p>
          </div>
        </div>

        <div>
          <h2 className="font-display text-[15px] font-bold text-on-surface mb-2">Zone 2 — Pool Raid</h2>
          <p className="font-mono text-[11px] text-on-surface-variant mb-3">
            Raid a percentage of the tier&apos;s prize pool. The bigger the pool, the bigger the prize.
          </p>
          <div className="rounded-xl bg-surface-container overflow-hidden">
            <div className="grid grid-cols-3 bg-surface-high">
              <TableHead>Result</TableHead>
              <TableHead>Pool %</TableHead>
              <TableHead>Chance</TableHead>
            </div>
            <OddsRow result="FULL DRAIN" mult="100%" chance="0.3%" highlight accent />
            <OddsRow result="Half Raid" mult="50%" chance="0.5%" highlight />
            <OddsRow result="Quarter Raid" mult="25%" chance="1.2%" highlight />
            <OddsRow result="10% Raid" mult="10%" chance="2%" highlight />
            <OddsRow result="5% Raid" mult="5%" chance="3%" highlight />
            <OddsRow result="No Raid" mult="—" chance="93%" highlight={false} />
          </div>
          <div className="mt-3 p-3 rounded-xl bg-secondary/[0.04]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-on-surface-variant">Raid chance</span>
              <span className="font-display text-sm font-bold text-secondary">7%</span>
            </div>
            <p className="font-mono text-[10px] text-text-muted mt-1">When you hit a raid, the payout comes directly from the prize pool</p>
          </div>
        </div>
      </div>

      {/* Zone 3 + Scaling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="font-display text-[15px] font-bold text-on-surface mb-2">Zone 3 — Free Ticket</h2>
          <p className="font-mono text-[11px] text-on-surface-variant mb-3">
            Win a free ticket to play again. Same odds, real payouts, no deposit needed.
          </p>
          <div className="rounded-xl bg-surface-container overflow-hidden">
            <div className="grid grid-cols-3 bg-surface-high">
              <TableHead>Result</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Chance</TableHead>
            </div>
            <div className="grid grid-cols-3 py-2.5 px-3 border-b border-surface-bright/20">
              <span className="font-mono text-[12px] text-on-surface font-semibold">Free Ticket</span>
              <span className="font-mono text-[12px] text-primary">Same tier</span>
              <span className="font-mono text-[12px] text-on-surface-variant">8%</span>
            </div>
            <div className="grid grid-cols-3 py-2.5 px-3 border-b border-surface-bright/20">
              <span className="font-mono text-[12px] text-on-surface font-semibold">Tier Up</span>
              <span className="font-mono text-[12px] text-tertiary">Next tier free</span>
              <span className="font-mono text-[12px] text-on-surface-variant">1%</span>
            </div>
            <div className="grid grid-cols-3 py-2.5 px-3">
              <span className="font-mono text-[12px] text-text-muted">Nothing</span>
              <span className="font-mono text-[12px] text-text-muted">&mdash;</span>
              <span className="font-mono text-[12px] text-text-muted">91%</span>
            </div>
          </div>
          <p className="font-mono text-[10px] text-text-muted mt-2 px-1">
            Nearly 1 in 10 tickets gives you a free replay
          </p>
        </div>

        <div>
          <h2 className="font-display text-[15px] font-bold text-on-surface mb-2">Pool Growth = Bigger Wins</h2>
          <p className="font-mono text-[11px] text-on-surface-variant mb-3">
            As more players join, the pool grows and unlocks higher multipliers.
          </p>
          <div className="rounded-xl bg-surface-container overflow-hidden mb-3">
            <div className="grid grid-cols-3 bg-surface-high">
              <TableHead>Pool Health</TableHead>
              <TableHead>Max Win</TableHead>
              <TableHead>Unlocked</TableHead>
            </div>
            <div className="grid grid-cols-3 py-2.5 px-3 border-b border-surface-bright/20">
              <span className="font-mono text-[12px] text-on-surface">Starting</span>
              <span className="font-mono text-[12px] text-primary font-bold">2x</span>
              <span className="font-mono text-[12px] text-on-surface-variant">0.25x &ndash; 2x</span>
            </div>
            <div className="grid grid-cols-3 py-2.5 px-3 border-b border-surface-bright/20">
              <span className="font-mono text-[12px] text-on-surface">Growing</span>
              <span className="font-mono text-[12px] text-primary font-bold">3x</span>
              <span className="font-mono text-[12px] text-on-surface-variant">0.25x &ndash; 3x</span>
            </div>
            <div className="grid grid-cols-3 py-2.5 px-3 bg-primary/[0.03]">
              <span className="font-mono text-[12px] text-primary font-bold">Healthy</span>
              <span className="font-mono text-[12px] text-primary font-bold">5x</span>
              <span className="font-mono text-[12px] text-primary">All multipliers</span>
            </div>
          </div>
          <p className="font-mono text-[10px] text-text-muted px-1">
            Early players build the pool. As it grows, everyone benefits from higher max wins and bigger raid payouts.
          </p>
        </div>
      </div>

      {/* Early Player Advantage */}
      <Section title="Early Player Advantage">
        <div className="rounded-xl bg-primary/[0.04] p-4">
          <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed mb-3">
            New tiers start in <span className="text-primary font-bold">Seeding Mode</span> with boosted conditions to reward early players:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-surface-container">
              <p className="font-display text-[12px] font-bold text-primary mb-1">Seeding (first 20)</p>
              <p className="font-mono text-[10px] text-on-surface-variant">0% platform fee. 100% of your ticket goes to the pool. Raids unlock quickly.</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container">
              <p className="font-display text-[12px] font-bold text-secondary mb-1">Growing (21-100)</p>
              <p className="font-mono text-[10px] text-on-surface-variant">5% platform fee. Pool is healthy and growing. All features active.</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container">
              <p className="font-display text-[12px] font-bold text-on-surface mb-1">Mature (100+)</p>
              <p className="font-mono text-[10px] text-on-surface-variant">10% platform fee. Full pool protection. Maximum raid potential.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Live Pool Balances */}
      <Section title="Live Prize Pools">
        <p className="font-mono text-[11px] text-on-surface-variant mb-3">
          Pool raid payouts scale with pool size. Here&apos;s what you could win right now:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIERS.map((t) => {
            const pool = poolMap.get(t.tier);
            const tc = pool?.ticketCount ?? 0;
            const balance = getRaidableBalance(pool?.balanceLamports ?? 0n, t.tier as Tier, tc);
            const phase = getBootstrapPhase(tc);
            const cutPct = getHouseCutPct(tc);
            return (
              <div key={t.tier} className="rounded-xl bg-surface-container p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Image src={`/images/tiers/${t.tier}_coin.webp`} alt={t.label} width={24} height={24} className="rounded" />
                    <span className="font-display text-[12px] font-bold text-on-surface">{t.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {phase !== "mature" && (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                        phase === "seeding" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                      }`}>
                        {cutPct}% fee
                      </span>
                    )}
                    <span className="font-display text-[14px] font-black text-on-surface">
                      {formatLamports(balance)} <span className="text-text-muted text-[10px]">SOL</span>
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: "10%", pct: 0.10 },
                    { label: "50%", pct: 0.50 },
                    { label: "100%", pct: 1.00 },
                  ].map((r) => (
                    <div key={r.label} className="text-center py-1 rounded-md bg-surface-lowest">
                      <p className="font-mono text-[9px] text-text-muted">Raid {r.label}</p>
                      <p className="font-display text-[11px] font-bold text-primary">{formatLamports(balance * BigInt(Math.round(r.pct * 100)) / 100n)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Coin Flip Rules */}
      <Section title="Coin Flip Rules">
        <div className="rounded-xl bg-surface-container p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="font-mono text-[10px] text-text-muted uppercase mb-1">How it works</p>
              <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed">
                Pick heads or tails, sit in a room. When an opponent joins, a provably fair coin flip determines the winner. 50/50 odds.
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-muted uppercase mb-1">Payout</p>
              <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed">
                Winner takes the entire pot (both deposits) minus a 3% platform fee. Example: two players bet 1 SOL each, winner gets 1.94 SOL.
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-muted uppercase mb-1">Leaving</p>
              <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed">
                You can leave a room before an opponent joins. A 3% fee applies (covers transaction costs). Rooms auto-cancel after 30 minutes.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-surface-bright/20">
            <p className="font-mono text-[10px] text-text-muted">
              10 tiers available from 0.001 SOL to 100 SOL &middot; 6 rooms per tier &middot; Up to 6 simultaneous games
            </p>
          </div>
        </div>
      </Section>

      {/* Provably Fair */}
      <Section title="Provably Fair">
        <p className="font-mono text-[11px] text-on-surface-variant mb-3">
          Every game outcome is cryptographically committed before you play and independently verifiable after.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoCard icon={"\u{1F512}"} title="Committed before you play" desc="A SHA-256 hash of the outcome seed is published before you buy your ticket or sit in a flip room. This locks the result before your payment." />
          <InfoCard icon={"\u{1F513}"} title="Revealed after the game" desc="The seed is shown after the game. You can verify: SHA-256(seed) matches the hash you saw before playing." />
          <InfoCard icon={"\u{1F9EE}"} title="Deterministic results" desc="Zone outcomes and coin flips are computed from the seed using standard cryptographic functions. Same seed always produces the same result." />
          <InfoCard icon={"\u{1F517}"} title="On-chain verification" desc="Every payout is a Solana transaction visible on the public blockchain. No hidden balances or off-chain tricks." />
        </div>
      </Section>

      {/* Verify */}
      <Section title="Verify a Game">
        <p className="font-mono text-[11px] text-on-surface-variant mb-3">
          Enter any ticket ID to independently verify its outcome.
        </p>
        <TicketVerifier />
      </Section>

      {/* Tiers */}
      <Section title="Scratch Ticket Tiers">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {TIERS.map((t) => (
            <div key={t.tier} className="rounded-xl bg-surface-container p-3 text-center">
              <Image src={`/images/tiers/${t.tier}_coin.webp`} alt={t.label} width={40} height={40} className="mx-auto rounded-lg mb-2" />
              <p className="font-display text-[12px] font-bold text-on-surface">{t.label}</p>
              <p className="font-mono text-[11px] text-primary">{t.ticketPrice} SOL</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Play CTA */}
      <div className="flex items-center justify-center gap-3 mt-4 mb-8">
        <a
          href="/"
          className="inline-block px-8 py-3 rounded-xl font-display text-[13px] font-extrabold uppercase tracking-[0.08em] text-on-primary cursor-pointer hover:brightness-110 transition-all"
          style={{ background: "linear-gradient(135deg, #2be88e, #34fea0 50%, #2be88e)", boxShadow: "0 4px 20px var(--glow-primary-strong)" }}
        >
          Play Scratch
        </a>
        <a
          href="/flip"
          className="inline-block px-8 py-3 rounded-xl font-display text-[13px] font-extrabold uppercase tracking-[0.08em] text-on-surface cursor-pointer hover:brightness-110 transition-all bg-surface-bright"
        >
          Coin Flip
        </a>
      </div>
    </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-[15px] font-bold text-on-surface mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-surface-container">
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="font-display text-[12px] font-bold text-primary">{n}</span>
      </div>
      <div>
        <p className="font-display text-[13px] font-bold text-on-surface">{title}</p>
        <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-2 px-3">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-text-muted">{children}</span>
    </div>
  );
}

function OddsRow({ result, mult, chance, highlight, accent }: { result: string; mult: string; chance: string; highlight: boolean; accent?: boolean }) {
  return (
    <div className={`grid grid-cols-3 py-2.5 px-3 border-b border-surface-bright/20 last:border-b-0 ${accent ? "bg-primary/[0.04]" : ""}`}>
      <span className={`font-mono text-[12px] ${accent ? "text-primary font-bold" : highlight ? "text-on-surface font-semibold" : "text-text-muted"}`}>{result}</span>
      <span className={`font-mono text-[12px] ${accent ? "text-primary font-bold" : highlight ? "text-primary" : "text-text-muted"}`}>{mult}</span>
      <span className="font-mono text-[12px] text-on-surface-variant">{chance}</span>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-surface-container">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div>
        <p className="font-display text-[12px] font-bold text-on-surface">{title}</p>
        <p className="font-mono text-[11px] text-on-surface-variant leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
