/**
 * Progressive house cut based on pool maturity (ticketCount).
 *
 * Phase 1 — Seeding (0-20 tickets): 0% house cut → pool fills fast
 * Phase 2 — Growing (21-100 tickets): 5% house cut → house starts earning
 * Phase 3 — Mature (101+ tickets): 10% house cut → full model
 */
export function calculateHouseCut(
  ticketPrice: bigint,
  ticketCount: number
): { toPool: bigint; toHouse: bigint } {
  if (ticketCount <= 20) {
    return { toPool: ticketPrice, toHouse: 0n };
  }
  if (ticketCount <= 100) {
    const toHouse = ticketPrice * 500n / 10_000n;
    return { toPool: ticketPrice - toHouse, toHouse };
  }
  const toHouse = ticketPrice * 1_000n / 10_000n;
  return { toPool: ticketPrice - toHouse, toHouse };
}

/**
 * Get the current bootstrap phase for a tier.
 */
export function getBootstrapPhase(ticketCount: number): "seeding" | "growing" | "mature" {
  if (ticketCount <= 20) return "seeding";
  if (ticketCount <= 100) return "growing";
  return "mature";
}

/**
 * Get house cut percentage for display.
 */
export function getHouseCutPct(ticketCount: number): number {
  if (ticketCount <= 20) return 0;
  if (ticketCount <= 100) return 5;
  return 10;
}
