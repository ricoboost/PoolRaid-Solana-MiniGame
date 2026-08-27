export function truncateWallet(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function formatSOL(amount: number | undefined | null): string {
  const n = amount ?? 0;
  let s: string;
  if (n >= 1) s = n.toFixed(2);
  else if (n >= 0.01) s = n.toFixed(3);
  else s = n.toFixed(4);
  // Strip trailing zeros after decimal, but keep at least one decimal
  return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function formatLamports(amount: string | bigint | undefined | null): string {
  const lamports = amount == null ? 0n : BigInt(amount);
  return formatSOL(Number(lamports) / 1_000_000_000);
}

export function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
