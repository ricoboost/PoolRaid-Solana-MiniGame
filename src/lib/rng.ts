import crypto from "node:crypto";
import type { Tier, Zone3Result } from "@/types";
import { getNextTier } from "@/lib/tiers";

export interface InternalZone1Result {
  label: string;
  multiplier: number;
  payoutLamports: bigint;
  capped: boolean;
  rawPayoutLamports: bigint;
}

export interface InternalZone2Result {
  label: string;
  poolPct: number;
  payoutLamports: bigint;
}

export function generateSeed(): { seed: string; seedHash: string } {
  const seed = crypto.randomBytes(32).toString("hex");
  return { seed, seedHash: crypto.createHash("sha256").update(seed).digest("hex") };
}

export function getRoll(seed: string, ticketId: string, zone: number): number {
  const hash = crypto.createHmac("sha256", seed).update(`${ticketId}:zone${zone}`).digest("hex");
  return parseInt(hash.substring(0, 8), 16) / 0x1_0000_0000;
}

function multiplierPayout(price: bigint, multiplier: number): bigint {
  return price * BigInt(Math.round(multiplier * 100)) / 100n;
}

function percentPayout(balance: bigint, bps: number): bigint {
  return balance * BigInt(bps) / 10_000n;
}

export function resolveTicket(
  seed: string,
  ticketId: string,
  ticketPriceLamports: bigint,
  rawPoolBalanceLamports: bigint,
  raidableBalanceLamports: bigint,
  maxMultiplier: number,
  tier: Tier,
): {
  zone1: InternalZone1Result;
  zone2: InternalZone2Result;
  zone3: Zone3Result;
  totalPayoutLamports: bigint;
} {
  const roll1 = getRoll(seed, ticketId, 1);
  const roll2 = getRoll(seed, ticketId, 2);
  const roll3 = getRoll(seed, ticketId, 3);

  let rolledMult = 0;
  let rolledLabel = "Nothing";
  if (roll1 < 0.20) [rolledMult, rolledLabel] = [0, "Nothing"];
  else if (roll1 < 0.45) [rolledMult, rolledLabel] = [0.25, "0.25×"];
  else if (roll1 < 0.65) [rolledMult, rolledLabel] = [0.5, "0.5×"];
  else if (roll1 < 0.80) [rolledMult, rolledLabel] = [1, "1×"];
  else if (roll1 < 0.90) [rolledMult, rolledLabel] = [1.5, "1.5×"];
  else if (roll1 < 0.95) [rolledMult, rolledLabel] = [2, "2×"];
  else if (roll1 < 0.98) [rolledMult, rolledLabel] = [3, "3×"];
  else [rolledMult, rolledLabel] = [5, "5×"];

  const effectiveMultiplier = Math.min(rolledMult, maxMultiplier);
  const rawPayoutLamports = multiplierPayout(ticketPriceLamports, rolledMult);
  const calculated = multiplierPayout(ticketPriceLamports, effectiveMultiplier);
  const payoutLamports = calculated > rawPoolBalanceLamports ? rawPoolBalanceLamports : calculated;
  const zone1: InternalZone1Result = {
    label: rolledLabel,
    multiplier: effectiveMultiplier,
    payoutLamports,
    capped: effectiveMultiplier < rolledMult || calculated > rawPoolBalanceLamports,
    rawPayoutLamports,
  };

  const rawAfterZone1 = rawPoolBalanceLamports - zone1.payoutLamports;
  const floor = rawPoolBalanceLamports - raidableBalanceLamports;
  const raidableAfterZone1 = rawAfterZone1 > floor ? rawAfterZone1 - floor : 0n;
  let zone2: InternalZone2Result;
  if (roll2 < 0.93) zone2 = { label: "No raid", poolPct: 0, payoutLamports: 0n };
  else if (roll2 < 0.96) zone2 = { label: "5% raid", poolPct: 0.05, payoutLamports: percentPayout(raidableAfterZone1, 500) };
  else if (roll2 < 0.98) zone2 = { label: "10% raid", poolPct: 0.10, payoutLamports: percentPayout(raidableAfterZone1, 1_000) };
  else if (roll2 < 0.992) zone2 = { label: "25% raid", poolPct: 0.25, payoutLamports: percentPayout(raidableAfterZone1, 2_500) };
  else if (roll2 < 0.997) zone2 = { label: "50% raid", poolPct: 0.50, payoutLamports: percentPayout(raidableAfterZone1, 5_000) };
  else zone2 = { label: "100% DRAIN", poolPct: 1, payoutLamports: raidableAfterZone1 };

  let zone3: Zone3Result;
  if (roll3 < 0.08) zone3 = { label: "Free ticket", type: "free_same", tier };
  else if (roll3 < 0.09) zone3 = { label: "Free tier up", type: "free_up", tier: getNextTier(tier) ?? tier };
  else zone3 = { label: "Nothing", type: "nothing" };

  return { zone1, zone2, zone3, totalPayoutLamports: zone1.payoutLamports + zone2.payoutLamports };
}

export function verifySeedHash(seed: string, seedHash: string): boolean {
  return crypto.createHash("sha256").update(seed).digest("hex") === seedHash;
}
