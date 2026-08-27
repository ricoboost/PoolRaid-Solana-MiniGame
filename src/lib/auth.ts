import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { prisma } from "@/lib/prisma";
import { getAdminWallet, getAppUrl, getAuthSecret } from "@/lib/env";

export const SESSION_COOKIE = "poolraid_session";
export type SessionRole = "player" | "admin";

export interface WalletSession {
  wallet: string;
  role: SessionRole;
}

export function buildAuthMessage(challenge: {
  wallet: string;
  purpose: SessionRole;
  nonce: string;
  createdAt: Date;
  expiresAt: Date;
}): string {
  return [
    "PoolRaid wallet authentication",
    `Origin: ${getAppUrl()}`,
    `Wallet: ${challenge.wallet}`,
    `Purpose: ${challenge.purpose}`,
    `Nonce: ${challenge.nonce}`,
    `Issued At: ${challenge.createdAt.toISOString()}`,
    `Expiration Time: ${challenge.expiresAt.toISOString()}`,
    "",
    "Signing this message does not submit a transaction or authorize a transfer.",
  ].join("\n");
}

export async function createAuthChallenge(wallet: string, purpose: SessionRole) {
  const publicKey = new PublicKey(wallet).toBase58();
  if (purpose === "admin" && publicKey !== getAdminWallet()) throw new Error("Unauthorized");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 5 * 60_000);
  const record = await prisma.authNonce.create({
    data: { wallet: publicKey, purpose, nonce: crypto.randomBytes(32).toString("hex"), expiresAt, createdAt },
  });
  return { id: record.id, message: buildAuthMessage({ ...record, purpose }), expiresAt };
}

export async function verifyAuthChallenge(id: string, signatureBase64: string): Promise<WalletSession> {
  const record = await prisma.authNonce.findUnique({ where: { id } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) throw new Error("Unauthorized");
  const purpose = record.purpose as SessionRole;
  const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(buildAuthMessage({ ...record, purpose })),
    Buffer.from(signatureBase64, "base64"),
    new PublicKey(record.wallet).toBytes(),
  );
  if (!valid) throw new Error("Unauthorized");
  const consumed = await prisma.authNonce.updateMany({
    where: { id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (consumed.count !== 1) throw new Error("Unauthorized");
  if (purpose === "admin" && record.wallet !== getAdminWallet()) throw new Error("Unauthorized");
  return { wallet: record.wallet, role: purpose };
}

export function issueSession(session: WalletSession): string {
  return jwt.sign({ sub: session.wallet, role: session.role }, getAuthSecret(), {
    algorithm: "HS256",
    expiresIn: session.role === "admin" ? "15m" : "24h",
  });
}

export function getSession(request: Request): WalletSession | null {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!match) return null;
  try {
    const decoded = jwt.verify(match[1], getAuthSecret(), { algorithms: ["HS256"] }) as jwt.JwtPayload;
    if (typeof decoded.sub !== "string" || (decoded.role !== "player" && decoded.role !== "admin")) return null;
    return { wallet: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}

export function requireWallet(request: Request): WalletSession {
  assertSameOrigin(request);
  const session = getSession(request);
  if (!session) throw new Error("Unauthorized");
  return session;
}

export function requireAdmin(request: Request): WalletSession {
  const session = requireWallet(request);
  if (session.role !== "admin" || session.wallet !== getAdminWallet()) throw new Error("Unauthorized");
  return session;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).origin !== getAppUrl()) throw new Error("Invalid origin");
}

export function sessionCookieOptions(role: SessionRole) {
  return {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: role === "admin" ? 15 * 60 : 24 * 60 * 60,
  };
}
