export const LAMPORTS_PER_SOL = 1_000_000_000n;
export const BPS_DENOMINATOR = 10_000n;

export function solToLamports(value: string | number): bigint {
  const raw = String(value).trim();
  if (!/^\d+(?:\.\d{1,9})?$/.test(raw)) throw new Error("Invalid SOL amount");
  const [whole, fraction = ""] = raw.split(".");
  return BigInt(whole) * LAMPORTS_PER_SOL + BigInt(fraction.padEnd(9, "0"));
}

export function lamportsToSolString(value: bigint | string | number): string {
  const lamports = typeof value === "bigint" ? value : BigInt(value);
  const negative = lamports < 0n;
  const absolute = negative ? -lamports : lamports;
  const whole = absolute / LAMPORTS_PER_SOL;
  const fraction = (absolute % LAMPORTS_PER_SOL).toString().padStart(9, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function lamportsToSolNumber(value: bigint | string | number): number {
  return Number(lamportsToSolString(value));
}

export function applyBps(amount: bigint, bps: number): bigint {
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) throw new Error("Invalid basis points");
  return (amount * BigInt(bps)) / BPS_DENOMINATOR;
}

export function serializeLamports(value: bigint | null | undefined): string | null {
  return value == null ? null : value.toString();
}
