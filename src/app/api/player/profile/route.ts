import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidSolanaAddress } from "@/lib/security";
import { getSession, requireWallet } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    const isOwner = getSession(request)?.wallet === wallet;

    if (!wallet || !isValidSolanaAddress(wallet)) {
      return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
    }

    // Find profile (don't auto-create on GET — no side effects)
    let profile = await prisma.playerProfile.findUnique({ where: { wallet } });
    if (!profile && isOwner) {
      // Only auto-create if the owner is viewing their own profile
      profile = await prisma.playerProfile.create({ data: { wallet } });
    }

    if (!profile) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Non-owner can't see private profiles (but avatar is always public)
    if (!isOwner && !profile.isPublic) {
      return NextResponse.json({ isPublic: false, avatar: profile.avatar }, { status: 200 });
    }

    const [tickets, achievements, referralCount, refCode, recentWins] = await Promise.all([
      prisma.ticket.findMany({
        where: { playerWallet: wallet, status: { in: ["scratched", "paid"] } },
        select: { priceLamports: true, totalPayoutLamports: true, isFreeTicket: true },
      }),
      prisma.achievement.findMany({
        where: { wallet },
        orderBy: { unlockedAt: "desc" },
        select: { achievementId: true, unlockedAt: true },
      }),
      prisma.referral.count({ where: { referrerWallet: wallet } }),
      isOwner ? prisma.referralCode.findUnique({ where: { wallet } }) : null,
      prisma.ticket.findMany({
        where: { playerWallet: wallet, totalPayoutLamports: { gt: 0n }, status: { in: ["scratched", "paid"] } },
        orderBy: { scratchedAt: "desc" },
        take: 10,
        select: { tier: true, totalPayoutLamports: true },
      }),
    ]);

    const totalWagered = tickets.filter((t) => !t.isFreeTicket).reduce((s, t) => s + t.priceLamports, 0n);
    const totalWon = tickets.reduce((s, t) => s + t.totalPayoutLamports, 0n);
    const winningTickets = tickets.filter((t) => t.totalPayoutLamports > 0n).length;

    const referralCode = refCode?.code ?? null;

    return NextResponse.json({
      displayName: profile.displayName,
      avatar: profile.avatar,
      isPublic: profile.isPublic,
      currentStreak: profile.currentStreak,
      bestStreak: profile.bestStreak,
      totalXp: profile.totalXp,
      level: profile.level,
      totalWageredLamports: totalWagered.toString(),
      totalWonLamports: totalWon.toString(),
      totalWagered: Number(totalWagered) / 1_000_000_000,
      totalWon: Number(totalWon) / 1_000_000_000,
      winRate: tickets.length > 0 ? (winningTickets / tickets.length) * 100 : 0,
      totalTickets: tickets.length,
      winningTickets,
      achievements: achievements.map((a) => ({
        achievementId: a.achievementId,
        unlockedAt: a.unlockedAt.toISOString(),
      })),
      referralCode: isOwner ? referralCode : null,
      referralCount,
      recentWins: recentWins.map((win) => ({
        tier: win.tier,
        totalPayoutLamports: win.totalPayoutLamports.toString(),
        totalPayout: Number(win.totalPayoutLamports) / 1_000_000_000,
      })),
    });
  } catch (error) {
    console.error("Error in GET /api/player/profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = requireWallet(request);
    const body = await request.json();
    const { displayName, isPublic, avatar } = body;
    const wallet = session.wallet;

    const data: Record<string, unknown> = {};
    if (displayName !== undefined) {
      const clean = String(displayName).slice(0, 20).replace(/[^a-zA-Z0-9_ ]/g, "").trim();
      data.displayName = clean || null;
    }
    if (isPublic !== undefined) {
      data.isPublic = Boolean(isPublic);
    }
    if (avatar !== undefined) {
      const VALID_AVATARS = ["Abase", "Acook", "Acyber", "Agirl", "Agolden", "Amystic", "Aneo", "Apirate", "Asensei", "Ashadow", "Asoldier", "Aspace"];
      if (avatar === null || VALID_AVATARS.includes(avatar)) {
        data.avatar = avatar;
      }
    }

    await prisma.playerProfile.upsert({
      where: { wallet },
      create: { wallet, ...data },
      update: data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in PATCH /api/player/profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
