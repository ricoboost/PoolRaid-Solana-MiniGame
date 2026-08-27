import { describe, expect, it } from "vitest";
import { generateSeed, getRoll, resolveTicket, verifySeedHash } from "@/lib/rng";

describe("scratch fairness", () => {
  it("commits to and verifies a server seed", () => {
    const pair = generateSeed();
    expect(verifySeedHash(pair.seed, pair.seedHash)).toBe(true);
    expect(verifySeedHash(`${pair.seed}0`, pair.seedHash)).toBe(false);
  });

  it("is deterministic for a seed, ticket, and zone", () => {
    const seed = "ab".repeat(32);
    expect(getRoll(seed, "ticket-1", 1)).toBe(getRoll(seed, "ticket-1", 1));
    expect(getRoll(seed, "ticket-1", 1)).not.toBe(getRoll(seed, "ticket-1", 2));
  });

  it("never pays more than the raw pool balance", () => {
    const price = 100_000_000n;
    const pool = 250_000_000n;
    for (let index = 0; index < 1_000; index += 1) {
      const result = resolveTicket(
        index.toString(16).padStart(64, "0"),
        `ticket-${index}`,
        price,
        pool,
        150_000_000n,
        5,
        "standard",
      );
      expect(result.totalPayoutLamports).toBeGreaterThanOrEqual(0n);
      expect(result.totalPayoutLamports).toBeLessThanOrEqual(pool);
    }
  });
});
