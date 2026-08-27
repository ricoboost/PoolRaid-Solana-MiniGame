import { describe, expect, it } from "vitest";
import { computeFlipResult, generateFlipSeed, verifyFlipSeedHash } from "@/lib/flip/flipFairness";

describe("coin-flip fairness", () => {
  it("verifies the pre-committed seed", () => {
    const pair = generateFlipSeed();
    expect(verifyFlipSeedHash(pair.serverSeed, pair.serverSeedHash)).toBe(true);
    expect(verifyFlipSeedHash("changed", pair.serverSeedHash)).toBe(false);
  });

  it("derives the same result from the same public inputs", () => {
    const args = ["11".repeat(32), "wallet-a", "wallet-b", "room-1"] as const;
    const first = computeFlipResult(...args);
    expect(computeFlipResult(...args)).toBe(first);
    expect(["heads", "tails"]).toContain(first);
  });
});
