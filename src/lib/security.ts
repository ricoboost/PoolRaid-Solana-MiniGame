import { PublicKey } from "@solana/web3.js";
import { prisma } from "./prisma";
import type { Tier } from "@/types";
import { TIER_ORDER } from "./tiers";
import { solToLamports } from "./money";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = parseInt(process.env.PAYOUT_RATE_LIMIT_PER_MIN || "10");

// Per-action rate limit overrides
const ACTION_LIMITS: Record<string, { windowMs: number; max: number }> = {
  flip_sit: { windowMs: 10_000, max: 1 },
};

/**
 * DB-backed rate limiter. Atomic: insert first, then count.
 * Prevents TOCTOU race where concurrent requests all pass the check.
 */
export async function checkRateLimit(wallet: string, action: string = "claim"): Promise<boolean> {
  maybeCleanup();

  const config = ACTION_LIMITS[action];
  const windowMs = config?.windowMs ?? RATE_LIMIT_WINDOW_MS;
  const max = config?.max ?? RATE_LIMIT_MAX;
  const windowStart = new Date(Date.now() - windowMs);

  // Step 1: Insert the record FIRST (optimistic)
  const record = await prisma.rateLimit.create({
    data: { wallet, action },
  });

  // Step 2: Count ALL records in window (including the one we just created)
  const count = await prisma.rateLimit.count({
    where: {
      wallet,
      action,
      timestamp: { gte: windowStart },
    },
  });

  // Step 3: If over limit, delete our record and reject
  if (count > max) {
    await prisma.rateLimit.delete({ where: { id: record.id } });
    return false;
  }

  return true;
}

/**
 * Cleanup old rate limit entries (call periodically)
 */
export async function cleanupRateLimits(): Promise<void> {
  const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS * 2);
  await prisma.rateLimit.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });
}

export function checkMaxPayout(amountLamports: bigint): boolean {
  const maximum = process.env.MAX_PAYOUT_LAMPORTS;
  return amountLamports <= (maximum ? BigInt(maximum) : solToLamports("50"));
}

export function isValidTier(tier: string): tier is Tier {
  return TIER_ORDER.includes(tier as Tier);
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function isValidTxSignature(sig: string): boolean {
  return /^[A-HJ-NP-Za-km-z1-9]{87,88}$/.test(sig);
}

// Auto-cleanup: run every 5 minutes
let lastCleanup = 0;
async function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  cleanupRateLimits().catch(() => {});
}

export function checkPoolHealth(
  balance: bigint,
  totalIn: bigint,
  tier: string
): void {
  if (totalIn > 0n && balance * 5n < totalIn) {
    console.warn(
      `[POOL ALERT] ${tier} pool balance (${balance}) is below 20% of totalIn (${totalIn})`
    );
  }
}
