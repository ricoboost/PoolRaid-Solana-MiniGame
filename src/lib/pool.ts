import { getTierConfig } from "./tiers";
import type { Tier } from "@/types";

/**
 * The hidden reserve floor for a tier's pool.
 * Dynamic based on pool maturity (ticketCount):
 *   Seeding (0-20):  1× ticket price — raids unlock fast
 *   Growing (21-100): 3× ticket price
 *   Mature (101+):   5× ticket price — full protection
 */
export function getPoolFloor(tier: Tier, ticketCount: number = 101): bigint {
  const config = getTierConfig(tier);
  if (ticketCount <= 20) return config.ticketPriceLamports;
  if (ticketCount <= 100) return config.ticketPriceLamports * 3n;
  return config.ticketPriceLamports * 5n;
}

/**
 * The raidable amount — what players can actually win from zone 2.
 */
export function getRaidableBalance(rawBalance: bigint, tier: Tier, ticketCount: number = 101): bigint {
  const value = rawBalance - getPoolFloor(tier, ticketCount);
  return value > 0n ? value : 0n;
}

/**
 * Dynamic max Zone 1 multiplier based on pool health.
 *
 *   Raidable pool 0 to <5×   → max 2×
 *   Raidable pool 5× to <10× → max 3×
 *   Raidable pool 10×+       → max 5×  (full unlock)
 */
export function getMaxMultiplier(raidableBalance: bigint, tier: Tier): number {
  const config = getTierConfig(tier);
  if (raidableBalance >= config.ticketPriceLamports * 10n) return 5;
  if (raidableBalance >= config.ticketPriceLamports * 5n) return 3;
  return 2;
}
