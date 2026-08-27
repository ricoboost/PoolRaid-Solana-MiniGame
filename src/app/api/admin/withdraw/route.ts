import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";
import { ensurePayout } from "@/lib/solana";
import { isValidSolanaAddress } from "@/lib/security";
import { solToLamports } from "@/lib/money";
import crypto from "node:crypto";
import { serializable } from "@/lib/db";

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { destinationWallet, amount } = await request.json();

  if (!destinationWallet || !isValidSolanaAddress(destinationWallet)) {
    return NextResponse.json({ error: "Invalid destination wallet" }, { status: 400 });
  }

  let amountLamports: bigint;
  try { amountLamports = solToLamports(String(amount)); } catch { amountLamports = 0n; }
  if (amountLamports <= 0n) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    // Atomic: check balance and decrement inside transaction BEFORE sending
    const operationId = crypto.randomUUID();
    await serializable(async (tx) => {
      const hp = await tx.houseProfit.findFirst();
      if (!hp || amountLamports > hp.totalProfitLamports) {
        throw new Error("Amount exceeds available house profit");
      }
      await tx.houseProfit.update({
        where: { id: hp.id },
        data: { totalProfitLamports: { decrement: amountLamports } },
      });
      await tx.adminLog.create({
        data: { id: operationId, action: "withdraw_reserved", details: `${amountLamports} lamports to ${destinationWallet}` },
      });
    });

    const payout = await ensurePayout({
      businessKey: `admin-withdraw:${operationId}`,
      kind: "admin_withdraw",
      recipientWallet: destinationWallet,
      amountLamports,
    });

    await prisma.adminLog.update({
      where: { id: operationId },
      data: { action: "withdraw", details: `${amountLamports} lamports to ${destinationWallet} tx:${payout.signature ?? "pending"}` },
    });

    return NextResponse.json({
      success: true,
      payoutStatus: payout.status,
      tx: payout.signature,
      amountLamports: amountLamports.toString(),
    }, { status: payout.status === "confirmed" ? 200 : 202 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Transfer failed";
    console.error("Withdraw failed:", err);
    return NextResponse.json({ error: msg }, { status: msg.includes("exceeds") ? 400 : 500 });
  }
}
