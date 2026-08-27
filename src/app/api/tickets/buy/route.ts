import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSeed } from "@/lib/rng";
import { getPoolAddress } from "@/lib/solana";
import { checkRateLimit, isValidTier } from "@/lib/security";
import { requireWallet } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = requireWallet(request);
    const { tier, referralCode } = await request.json();
    if (!isValidTier(tier)) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    if (!(await checkRateLimit(session.wallet, "buy"))) {
      return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
    }
    const exclusion = await prisma.selfExclusion.findFirst({
      where: { walletAddress: session.wallet, excludeUntil: { gt: new Date() } },
    });
    if (exclusion) {
      const message = exclusion.isPermanent
        ? "Your wallet is permanently self-excluded from PoolRaid"
        : `Your wallet is self-excluded until ${exclusion.excludeUntil.toISOString()}`;
      return NextResponse.json({ error: message }, { status: 403 });
    }

    const config = await prisma.gameConfig.findUnique({ where: { tier } });
    if (!config?.isActive) return NextResponse.json({ error: "Tier not available" }, { status: 400 });

    const { seed, seedHash } = generateSeed();
    const id = crypto.randomUUID();
    const memo = `poolraid:ticket:${id}`;
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    const cleanReferral = typeof referralCode === "string" && /^[a-z0-9]{4,20}$/.test(referralCode.toLowerCase().trim())
      ? referralCode.toLowerCase().trim()
      : null;
    const ticket = await prisma.ticket.create({
      data: {
        id,
        tier,
        priceLamports: config.ticketPriceLamports,
        playerWallet: session.wallet,
        seedHash,
        seed,
        status: "pending",
        depositMemo: memo,
        depositExpiresAt: expiresAt,
        referralCode: cleanReferral,
      },
    });

    return NextResponse.json({
      ticketId: ticket.id,
      seedHash,
      depositAddress: getPoolAddress().toBase58(),
      amountLamports: config.ticketPriceLamports.toString(),
      memo,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && ["Unauthorized", "Invalid origin"].includes(error.message)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/tickets/buy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
