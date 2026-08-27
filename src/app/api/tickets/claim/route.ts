import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensurePayout } from "@/lib/solana";
import { checkMaxPayout, checkRateLimit } from "@/lib/security";
import { requireWallet } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = requireWallet(request);
    const { ticketId } = await request.json();
    if (typeof ticketId !== "string") return NextResponse.json({ error: "Missing ticketId" }, { status: 400 });
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.playerWallet !== session.wallet) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    if (!["scratched", "claiming", "paid"].includes(ticket.status)) {
      return NextResponse.json({ error: "Ticket not scratched yet" }, { status: 409 });
    }
    if (ticket.totalPayoutLamports <= 0n) {
      return NextResponse.json({ error: "Nothing to claim" }, { status: 400 });
    }
    if (!checkMaxPayout(ticket.totalPayoutLamports)) {
      return NextResponse.json({ error: "Payout exceeds configured maximum" }, { status: 400 });
    }
    if (!(await checkRateLimit(session.wallet, "claim"))) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "claiming", payoutStatus: "pending" },
    });
    const payout = await ensurePayout({
      businessKey: `ticket:${ticket.id}`,
      kind: "scratch_claim",
      recipientWallet: ticket.playerWallet,
      amountLamports: ticket.totalPayoutLamports,
    });
    const paid = payout.status === "confirmed";
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: paid ? "paid" : "claiming",
        payoutStatus: payout.status,
        payoutTx: payout.signature,
      },
    });
    return NextResponse.json({
      ticketId: ticket.id,
      payoutLamports: ticket.totalPayoutLamports.toString(),
      payoutStatus: payout.status,
      payoutTx: payout.signature,
    }, { status: paid ? 200 : 202 });
  } catch (error) {
    if (error instanceof Error && ["Unauthorized", "Invalid origin"].includes(error.message)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/tickets/claim:", error);
    return NextResponse.json({ error: "Payout could not be submitted; it remains retryable" }, { status: 500 });
  }
}
