import { describe, expect, it } from "vitest";
import { applyBps, lamportsToSolString, solToLamports } from "@/lib/money";

describe("lamport conversions", () => {
  it("converts decimal SOL without floating-point rounding", () => {
    expect(solToLamports("0.000000001")).toBe(1n);
    expect(solToLamports("10.123456789")).toBe(10_123_456_789n);
    expect(lamportsToSolString(10_123_456_789n)).toBe("10.123456789");
  });

  it("rejects excess precision and exponential notation", () => {
    expect(() => solToLamports("0.0000000001")).toThrow("Invalid SOL amount");
    expect(() => solToLamports("1e3")).toThrow("Invalid SOL amount");
  });

  it("applies basis points with integer floor rounding", () => {
    expect(applyBps(2_000_000_000n, 300)).toBe(60_000_000n);
    expect(applyBps(101n, 500)).toBe(5n);
  });
});
