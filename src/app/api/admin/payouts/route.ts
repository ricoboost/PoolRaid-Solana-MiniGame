import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50"), 1), 100);
  const skip = (page - 1) * limit;

  const [payouts, total] = await Promise.all([
    prisma.ticket.findMany({
      where: { totalPayoutLamports: { gt: 0n }, status: { in: ["scratched", "paid"] } },
      orderBy: { scratchedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true, scratchedAt: true, playerWallet: true, tier: true,
        totalPayoutLamports: true, payoutTx: true, zone1Result: true, zone2Result: true,
      },
    }),
    prisma.ticket.count({ where: { totalPayoutLamports: { gt: 0n }, status: { in: ["scratched", "paid"] } } }),
  ]);

  return NextResponse.json({
    payouts: payouts.map((t) => ({
      id: t.id,
      time: t.scratchedAt?.toISOString() ?? "",
      wallet: t.playerWallet,
      tier: t.tier,
      amount: Number(t.totalPayoutLamports) / 1_000_000_000,
      tx: t.payoutTx,
    })),
    total,
    page,
  });
}
