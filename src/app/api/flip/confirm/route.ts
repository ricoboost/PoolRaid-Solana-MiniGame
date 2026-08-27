import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireWallet } from "@/lib/auth";
import { isValidTxSignature } from "@/lib/security";
import { confirmReservation, refundInvalidReservation } from "@/lib/flip/flipService";
import { getPoolAddress, verifyDeposit } from "@/lib/solana";

export async function POST(request: Request) {
  try {
    const session = requireWallet(request);
    const { reservationId, txSignature } = await request.json();
    if (typeof reservationId !== "string" || !isValidTxSignature(txSignature)) {
      return NextResponse.json({ error: "Invalid reservation or signature" }, { status: 400 });
    }
    const reservation = await prisma.flipReservation.findUnique({ where: { id: reservationId } });
    if (!reservation || reservation.wallet !== session.wallet) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    const recipient = getPoolAddress().toBase58();
    const valid = await verifyDeposit({
      signature: txSignature,
      wallet: session.wallet,
      recipient,
      amountLamports: reservation.amountLamports,
      memo: reservation.memo,
    });
    if (!valid) return NextResponse.json({ error: "Finalized deposit did not match this reservation" }, { status: 400 });

    try {
      const room = await confirmReservation(reservation.id, txSignature, session.wallet, recipient);
      return NextResponse.json({ room });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("expired") || message.includes("no longer active") || message.includes("already handled")) {
        const payout = await refundInvalidReservation(reservation.id, txSignature, session.wallet, recipient);
        return NextResponse.json({
          error: "Reservation expired after payment; a full refund was queued",
          payoutStatus: payout.status,
          payoutTx: payout.signature,
        }, { status: 202 });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Transaction already used" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Unable to confirm reservation";
    const status = ["Unauthorized", "Invalid origin"].includes(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
