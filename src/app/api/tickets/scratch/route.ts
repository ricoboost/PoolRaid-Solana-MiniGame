import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateSeed, resolveTicket } from "@/lib/rng";
import { getMaxMultiplier, getRaidableBalance } from "@/lib/pool";
import { checkAchievements } from "@/lib/achievements";
import { calculateXpGain, getLevelForXp } from "@/lib/xp";
import { requireWallet } from "@/lib/auth";
import { serializable } from "@/lib/db";
import type { Tier, Zone1Result, Zone2Result, Zone3Result } from "@/types";

export async function POST(request: Request) {
  try {
    const session = requireWallet(request);
    const { ticketId } = await request.json();
    if (typeof ticketId !== "string") return NextResponse.json({ error: "Missing ticketId" }, { status: 400 });

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.playerWallet !== session.wallet) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    if (ticket.status !== "funded" || !ticket.seed) {
      return NextResponse.json({ error: "Ticket is not available to scratch" }, { status: 409 });
    }

    const response = await serializable(async (tx) => {
      const fresh = await tx.ticket.findUnique({ where: { id: ticketId } });
      if (!fresh || fresh.status !== "funded" || !fresh.seed) throw new Error("Ticket already scratched");
      const pool = await tx.pool.findUnique({ where: { tier: fresh.tier } });
      if (!pool) throw new Error("Pool not found");
      const raidable = getRaidableBalance(pool.balanceLamports, fresh.tier as Tier, pool.ticketCount);
      const resolved = resolveTicket(
        fresh.seed,
        fresh.id,
        fresh.priceLamports,
        pool.balanceLamports,
        raidable,
        getMaxMultiplier(raidable, fresh.tier as Tier),
        fresh.tier as Tier,
      );
      const zone1: Zone1Result = {
        label: resolved.zone1.label,
        multiplier: resolved.zone1.multiplier,
        payoutLamports: resolved.zone1.payoutLamports.toString(),
        capped: resolved.zone1.capped,
        rawPayoutLamports: resolved.zone1.rawPayoutLamports.toString(),
      };
      const zone2: Zone2Result = {
        label: resolved.zone2.label,
        poolPct: resolved.zone2.poolPct,
        payoutLamports: resolved.zone2.payoutLamports.toString(),
      };
      const zone3: Zone3Result = resolved.zone3;

      await tx.ticket.update({
        where: { id: fresh.id },
        data: {
          zone1Result: zone1 as unknown as Prisma.InputJsonValue,
          zone2Result: zone2 as unknown as Prisma.InputJsonValue,
          zone3Result: zone3 as unknown as Prisma.InputJsonValue,
          totalPayoutLamports: resolved.totalPayoutLamports,
          status: "scratched",
          scratchedAt: new Date(),
        },
      });
      if (resolved.totalPayoutLamports > 0n) {
        await tx.pool.update({
          where: { tier: fresh.tier },
          data: {
            balanceLamports: { decrement: resolved.totalPayoutLamports },
            totalOutLamports: { increment: resolved.totalPayoutLamports },
          },
        });
      }

      const profile = await tx.playerProfile.upsert({
        where: { wallet: fresh.playerWallet },
        create: {
          wallet: fresh.playerWallet,
          currentStreak: resolved.totalPayoutLamports > 0n ? 1 : 0,
          bestStreak: resolved.totalPayoutLamports > 0n ? 1 : 0,
        },
        update: resolved.totalPayoutLamports > 0n ? { currentStreak: { increment: 1 } } : { currentStreak: 0 },
      });
      const bestStreak = Math.max(profile.bestStreak, profile.currentStreak);
      if (bestStreak !== profile.bestStreak) {
        await tx.playerProfile.update({ where: { wallet: fresh.playerWallet }, data: { bestStreak } });
      }

      const unlocked = await checkAchievements(tx, {
        wallet: fresh.playerWallet,
        totalPayoutLamports: resolved.totalPayoutLamports,
        zone1,
        zone2,
        zone3,
        currentStreak: profile.currentStreak,
      });
      const xpBase = calculateXpGain(zone1, zone2, zone3, resolved.totalPayoutLamports, unlocked.length);
      const xpGained = fresh.isFreeTicket ? Math.floor(xpBase * 0.5) : xpBase;
      const updatedProfile = await tx.playerProfile.update({
        where: { wallet: fresh.playerWallet },
        data: { totalXp: { increment: xpGained } },
      });
      const level = getLevelForXp(updatedProfile.totalXp).level;
      if (updatedProfile.level !== level) {
        await tx.playerProfile.update({ where: { wallet: fresh.playerWallet }, data: { level } });
      }

      let freeTicketId: string | undefined;
      let freeTicketTier: string | undefined;
      if (zone3.type !== "nothing" && zone3.tier) {
        let targetTier = zone3.tier;
        if (zone3.type === "free_up" && targetTier !== fresh.tier) {
          const targetPool = await tx.pool.findUnique({ where: { tier: targetTier } });
          if (!targetPool || targetPool.balanceLamports <= 0n) targetTier = fresh.tier;
        }
        const config = await tx.gameConfig.findUnique({ where: { tier: targetTier } });
        if (config) {
          const next = generateSeed();
          const free = await tx.ticket.create({
            data: {
              tier: targetTier,
              priceLamports: config.ticketPriceLamports,
              playerWallet: fresh.playerWallet,
              seedHash: next.seedHash,
              seed: next.seed,
              status: "funded",
              isFreeTicket: true,
            },
          });
          freeTicketId = free.id;
          freeTicketTier = targetTier;
        }
      }

      return {
        zone1,
        zone2,
        zone3,
        totalPayoutLamports: resolved.totalPayoutLamports.toString(),
        seed: fresh.seed,
        freeTicketId,
        freeTicketTier,
        currentStreak: profile.currentStreak,
        bestStreak,
        xpGained,
        totalXp: updatedProfile.totalXp,
        level,
        newAchievements: unlocked.map((achievement) => ({
          id: achievement.id,
          name: achievement.name,
          icon: achievement.icon,
        })),
      };
    });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && ["Unauthorized", "Invalid origin"].includes(error.message)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error && error.message === "Ticket already scratched"
      ? error.message
      : "Unable to scratch ticket";
    return NextResponse.json({ error: message }, { status: message === "Ticket already scratched" ? 409 : 500 });
  }
}
