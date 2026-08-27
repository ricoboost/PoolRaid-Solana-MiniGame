import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPoolAddress, verifyDeposit } from "@/lib/solana";
import { calculateHouseCut } from "@/lib/payout";
import { isValidTxSignature } from "@/lib/security";
import { requireWallet } from "@/lib/auth";
import { serializable } from "@/lib/db";
import { generateSeed } from "@/lib/rng";

export async function POST(request: Request) {
  try {
    const session = requireWallet(request);
    const { ticketId, txSignature } = await request.json();
    if (typeof ticketId !== "string" || !isValidTxSignature(txSignature)) {
      return NextResponse.json({ error: "Invalid ticket or transaction signature" }, { status: 400 });
    }
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.playerWallet !== session.wallet) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    if (ticket.status !== "pending" || !ticket.depositMemo || !ticket.depositExpiresAt) {
      return NextResponse.json({ error: "Ticket already confirmed" }, { status: 409 });
    }
    if (ticket.depositExpiresAt <= new Date()) {
      return NextResponse.json({ error: "Deposit intent expired; create a new ticket" }, { status: 410 });
    }
    const recipient = getPoolAddress().toBase58();
    const valid = await verifyDeposit({
      signature: txSignature,
      wallet: session.wallet,
      recipient,
      amountLamports: ticket.priceLamports,
      memo: ticket.depositMemo,
    });
    if (!valid) return NextResponse.json({ error: "Finalized deposit did not match this ticket" }, { status: 400 });

    await serializable(async (tx) => {
      const fresh = await tx.ticket.findUnique({ where: { id: ticketId } });
      if (!fresh || fresh.status !== "pending") throw new Error("Ticket already confirmed");
      await tx.deposit.create({
        data: {
          signature: txSignature,
          wallet: session.wallet,
          recipient,
          amountLamports: fresh.priceLamports,
          memo: fresh.depositMemo!,
          purpose: "ticket",
          referenceId: fresh.id,
        },
      });
      const pool = await tx.pool.findUnique({ where: { tier: fresh.tier } });
      if (!pool) throw new Error("Pool not found");
      const { toPool, toHouse } = calculateHouseCut(fresh.priceLamports, pool.ticketCount);
      await tx.ticket.update({ where: { id: ticketId }, data: { status: "funded", depositTx: txSignature } });
      await tx.pool.update({
        where: { tier: fresh.tier },
        data: {
          balanceLamports: { increment: toPool },
          totalInLamports: { increment: toPool },
          ticketCount: { increment: 1 },
        },
      });
      if (toHouse > 0n) {
        await tx.houseProfit.updateMany({ data: { totalProfitLamports: { increment: toHouse } } });
      }

      if (fresh.referralCode) {
        const previousReferral = await tx.referral.findUnique({ where: { referredWallet: session.wallet } });
        const referralCode = await tx.referralCode.findUnique({ where: { code: fresh.referralCode } });
        if (!previousReferral && referralCode && referralCode.wallet !== session.wallet) {
          await tx.referral.create({
            data: {
              referrerWallet: referralCode.wallet,
              referredWallet: session.wallet,
              code: fresh.referralCode,
              bonusPaid: true,
            },
          });
          const excluded = await tx.selfExclusion.findFirst({
            where: { walletAddress: referralCode.wallet, excludeUntil: { gt: new Date() } },
          });
          if (!excluded) {
            const rewardTier = ["micro", "mini", "standard"].includes(fresh.tier) ? fresh.tier : "standard";
            const rewardConfig = await tx.gameConfig.findUnique({ where: { tier: rewardTier } });
            if (rewardConfig) {
              const rewardSeed = generateSeed();
              await tx.ticket.create({
                data: {
                  tier: rewardTier,
                  priceLamports: rewardConfig.ticketPriceLamports,
                  playerWallet: referralCode.wallet,
                  seedHash: rewardSeed.seedHash,
                  seed: rewardSeed.seed,
                  status: "funded",
                  isFreeTicket: true,
                },
              });
            }
          }
        }
      }
    });
    return NextResponse.json({ ticketId, status: "funded" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Transaction already used" }, { status: 409 });
    }
    if (error instanceof Error && ["Unauthorized", "Invalid origin"].includes(error.message)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/tickets/confirm:", error);
    return NextResponse.json({ error: "Unable to confirm ticket" }, { status: 500 });
  }
}
