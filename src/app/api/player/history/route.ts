import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidSolanaAddress } from "@/lib/security";
import { truncateWallet } from "@/lib/utils";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50") || 50, 100);

    if (!wallet || !isValidSolanaAddress(wallet)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }
    const isOwner = getSession(request)?.wallet === wallet;
    const profile = await prisma.playerProfile.findUnique({ where: { wallet }, select: { isPublic: true } });
    if (!isOwner && !profile?.isPublic) {
      return NextResponse.json({ error: "Profile is private" }, { status: 403 });
    }

    const [tickets, flips] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          playerWallet: wallet,
          ...(!isOwner ? { status: { in: ["scratched", "paid"] } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          tier: true,
          priceLamports: true,
          zone1Result: true,
          zone2Result: true,
          zone3Result: true,
          totalPayoutLamports: true,
          payoutTx: true,
          status: true,
          isFreeTicket: true,
          createdAt: true,
          scratchedAt: true,
        },
      }),
      prisma.flipHistory.findMany({
        where: {
          OR: [
            { playerAWallet: wallet },
            { playerBWallet: wallet },
          ],
        },
        orderBy: { completedAt: "desc" },
        take: limit,
      }),
    ]);

    const flipRecords = flips.map((f) => ({
      id: f.id,
      type: "flip" as const,
      tier: Number(f.tierLamports) / 1_000_000_000,
      tierLamports: f.tierLamports.toString(),
      amount: Number(f.tierLamports) / 1_000_000_000,
      result: f.result,
      won: f.winnerWallet === wallet,
      payout: f.winnerWallet === wallet ? Number(f.payoutLamports) / 1_000_000_000 : 0,
      payoutLamports: f.winnerWallet === wallet ? f.payoutLamports.toString() : "0",
      payoutTx: f.winnerWallet === wallet ? f.payoutTx : null,
      opponent: truncateWallet(f.playerAWallet === wallet ? f.playerBWallet : f.playerAWallet),
      side: f.playerAWallet === wallet ? "heads" : "tails",
      completedAt: f.completedAt.toISOString(),
    }));

    const nextCursor = tickets.length === limit ? tickets[tickets.length - 1].id : null;

    return NextResponse.json({
      tickets: tickets.map((ticket) => ({
        ...ticket,
        priceLamports: ticket.priceLamports.toString(),
        totalPayoutLamports: ticket.totalPayoutLamports.toString(),
        price: Number(ticket.priceLamports) / 1_000_000_000,
        totalPayout: Number(ticket.totalPayoutLamports) / 1_000_000_000,
      })),
      flips: flipRecords,
      nextCursor,
    });
  } catch (error) {
    console.error("Error in /api/player/history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
