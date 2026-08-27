export const FLIP_TIERS = [0.001, 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 50, 100] as const;
export type FlipTier = (typeof FLIP_TIERS)[number];

export const ROOMS_PER_TIER = 6;
export const FLIP_HOUSE_CUT = 0.03;
export const FLIP_LEAVE_FEE = 0.03;
export const FLIP_HOUSE_CUT_BPS = 300;
export const FLIP_LEAVE_FEE_BPS = 300;

export function flipTierToLamports(value: FlipTier | number): bigint {
  return BigInt(Math.round(value * 1_000_000_000));
}

export function lamportsToFlipTier(value: bigint): FlipTier {
  const tier = Number(value) / 1_000_000_000;
  if (!isValidFlipTier(tier)) throw new Error("Invalid flip tier");
  return tier;
}

export function isValidFlipTier(value: number): value is FlipTier {
  return (FLIP_TIERS as readonly number[]).includes(value);
}

export function formatFlipTier(tier: number): string {
  if (tier >= 1) return `${tier}`;
  return `${tier}`;
}
