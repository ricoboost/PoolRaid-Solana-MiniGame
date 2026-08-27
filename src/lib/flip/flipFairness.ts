import crypto from "crypto";

export function generateFlipSeed(): { serverSeed: string; serverSeedHash: string } {
  const serverSeed = crypto.randomBytes(32).toString("hex");
  const serverSeedHash = crypto.createHash("sha256").update(serverSeed).digest("hex");
  return { serverSeed, serverSeedHash };
}

export function computeFlipResult(
  serverSeed: string,
  playerAWallet: string,
  playerBWallet: string,
  roomId: string
): "heads" | "tails" {
  const combined = `${serverSeed}:${playerAWallet}:${playerBWallet}:${roomId}`;
  const hash = crypto.createHash("sha256").update(combined).digest("hex");
  const firstByte = parseInt(hash.substring(0, 2), 16);
  return firstByte < 128 ? "heads" : "tails";
}

export function verifyFlipSeedHash(serverSeed: string, serverSeedHash: string): boolean {
  const computed = crypto.createHash("sha256").update(serverSeed).digest("hex");
  return computed === serverSeedHash;
}
