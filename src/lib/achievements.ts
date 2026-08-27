import type { PrismaClient } from "@prisma/client";
import type { Zone1Result, Zone2Result, Zone3Result } from "@/types";

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_win", name: "First Blood", description: "Win any payout", icon: "\u{1FA78}" },
  { id: "streak_3", name: "Hot Hands", description: "3 wins in a row", icon: "\u{1F525}" },
  { id: "streak_5", name: "On Fire", description: "5 wins in a row", icon: "\u26A1" },
  { id: "streak_10", name: "Unstoppable", description: "10 wins in a row", icon: "\u{1F48E}" },
  { id: "raid_10", name: "Pool Raider", description: "Hit a 10%+ raid", icon: "\u{1F3F4}\u200D\u2620\uFE0F" },
  { id: "raid_100", name: "Pool Drainer", description: "Hit 100% DRAIN", icon: "\u{1F480}" },
  { id: "big_win", name: "Jackpot", description: "Win 1+ SOL on a single ticket", icon: "\u{1F3B0}" },
  { id: "tickets_10", name: "Regular", description: "Scratch 10 tickets", icon: "\u{1F3AB}" },
  { id: "tickets_50", name: "Collector", description: "Scratch 50 tickets", icon: "\u{1F4DA}" },
  { id: "tickets_100", name: "Addict", description: "Scratch 100 tickets", icon: "\u{1F3C6}" },
  { id: "free_ticket", name: "Lucky Charm", description: "Win a free ticket", icon: "\u{1F340}" },
  { id: "whale", name: "Whale Alert", description: "Wager 10+ SOL total", icon: "\u{1F40B}" },
];

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

interface ScratchContext {
  wallet: string;
  totalPayoutLamports: bigint;
  zone1: Zone1Result;
  zone2: Zone2Result;
  zone3: Zone3Result;
  currentStreak: number;
}

export async function checkAchievements(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  ctx: ScratchContext
): Promise<AchievementDef[]> {
  const { wallet } = ctx;

  // Get existing achievements
  const existing = await tx.achievement.findMany({
    where: { wallet },
    select: { achievementId: true },
  });
  const has = new Set(existing.map((a) => a.achievementId));

  // Get aggregate stats
  const ticketCount = await tx.ticket.count({
    where: { playerWallet: wallet, status: { in: ["scratched", "paid"] } },
  });
  const totalWagered = await tx.ticket.aggregate({
    where: { playerWallet: wallet, isFreeTicket: false, status: { in: ["scratched", "paid"] } },
    _sum: { priceLamports: true },
  });

  const candidates: string[] = [];

  // Win-based
  if (ctx.totalPayoutLamports > 0n && !has.has("first_win")) candidates.push("first_win");
  if (ctx.totalPayoutLamports >= 1_000_000_000n && !has.has("big_win")) candidates.push("big_win");

  // Streak-based
  if (ctx.currentStreak >= 3 && !has.has("streak_3")) candidates.push("streak_3");
  if (ctx.currentStreak >= 5 && !has.has("streak_5")) candidates.push("streak_5");
  if (ctx.currentStreak >= 10 && !has.has("streak_10")) candidates.push("streak_10");

  // Raid-based
  if (ctx.zone2.poolPct >= 0.1 && !has.has("raid_10")) candidates.push("raid_10");
  if (ctx.zone2.poolPct >= 1.0 && !has.has("raid_100")) candidates.push("raid_100");

  // Free ticket
  if (ctx.zone3.type !== "nothing" && !has.has("free_ticket")) candidates.push("free_ticket");

  // Volume-based
  if (ticketCount >= 10 && !has.has("tickets_10")) candidates.push("tickets_10");
  if (ticketCount >= 50 && !has.has("tickets_50")) candidates.push("tickets_50");
  if (ticketCount >= 100 && !has.has("tickets_100")) candidates.push("tickets_100");

  // Whale
  const wagered = totalWagered._sum.priceLamports ?? 0n;
  if (wagered >= 10_000_000_000n && !has.has("whale")) candidates.push("whale");

  // Insert new achievements
  if (candidates.length > 0) {
    await tx.achievement.createMany({
      data: candidates.map((achievementId) => ({ wallet, achievementId })),
      skipDuplicates: true,
    });
  }

  return candidates
    .map((id) => getAchievementDef(id))
    .filter((a): a is AchievementDef => !!a);
}
