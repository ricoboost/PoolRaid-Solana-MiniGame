import fs from "node:fs";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return new URL(configured).origin;
  if (process.env.NODE_ENV === "production") return required("NEXT_PUBLIC_APP_URL");
  return "http://localhost:3000";
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must contain at least 32 characters");
  return "poolraid-development-only-secret-change-me";
}

export function getPoolWalletSecret(): string {
  const secretFile = process.env.POOL_WALLET_KEYPAIR_FILE?.trim();
  if (secretFile) return fs.readFileSync(secretFile, "utf8").trim();
  if (process.env.NODE_ENV !== "production") return required("POOL_WALLET_PRIVATE_KEY");
  throw new Error("POOL_WALLET_KEYPAIR_FILE is required in production");
}

export function getSolanaRpcUrl(): string {
  return process.env.SOLANA_RPC_URL?.trim() || "https://api.devnet.solana.com";
}

export function getSolanaCommitment(): "confirmed" | "finalized" {
  return process.env.SOLANA_COMMITMENT === "confirmed" ? "confirmed" : "finalized";
}

export function getAdminWallet(): string {
  return required("ADMIN_WALLET");
}
