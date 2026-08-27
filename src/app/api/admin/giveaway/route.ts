import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";
import { generateSeed } from "@/lib/rng";
import { isValidSolanaAddress, isValidTier } from "@/lib/security";

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { walletAddress, tier, count } = await request.json();

  if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  }
  if (!tier || !isValidTier(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }
  const ticketCount = Math.min(Math.max(parseInt(count) || 1, 1), 100);

  const config = await prisma.gameConfig.findUnique({ where: { tier } });
  if (!config) {
    return NextResponse.json({ error: "Tier not found" }, { status: 400 });
  }

  const ticketIds: string[] = [];
  for (let i = 0; i < ticketCount; i++) {
    const { seed, seedHash } = generateSeed();
    const ticket = await prisma.ticket.create({
      data: {
        tier,
        priceLamports: config.ticketPriceLamports,
        playerWallet: walletAddress,
        seedHash,
        seed,
        status: "funded",
        isFreeTicket: true,
      },
    });
    ticketIds.push(ticket.id);
  }

  await prisma.giveawayLog.create({
    data: { walletAddress, tier, count: ticketCount },
  });

  await prisma.adminLog.create({
    data: { action: "giveaway", details: `${ticketCount}x ${tier} to ${walletAddress}` },
  });

  return NextResponse.json({ success: true, ticketIds, tier, count: ticketCount });
}
