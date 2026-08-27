import { describe, expect, it } from "vitest";
import { calculateHouseCut } from "@/lib/payout";
import { getMaxMultiplier, getPoolFloor, getRaidableBalance } from "@/lib/pool";

describe("scratch pool accounting", () => {
  it("never exposes the protected reserve", () => {
    expect(getPoolFloor("standard", 10)).toBe(100_000_000n);
    expect(getPoolFloor("standard", 50)).toBe(300_000_000n);
    expect(getPoolFloor("standard", 101)).toBe(500_000_000n);
    expect(getRaidableBalance(400_000_000n, "standard", 101)).toBe(0n);
  });

  it("conserves every deposited lamport across pool and house", () => {
    for (const count of [0, 20, 21, 100, 101]) {
      const price = 123_456_789n;
      const split = calculateHouseCut(price, count);
      expect(split.toPool + split.toHouse).toBe(price);
    }
  });

  it("unlocks multipliers only as the raidable pool grows", () => {
    expect(getMaxMultiplier(0n, "mini")).toBe(2);
    expect(getMaxMultiplier(50_000_000n, "mini")).toBe(3);
    expect(getMaxMultiplier(100_000_000n, "mini")).toBe(5);
  });
});
