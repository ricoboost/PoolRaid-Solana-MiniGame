import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { truncateWallet } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        tier: true,
        priceLamports: true,
        seedHash: true,
        seed: true,
        zone1Result: true,
        zone2Result: true,
        zone3Result: true,
        totalPayoutLamports: true,
        payoutTx: true,
        depositTx: true,
        status: true,
        scratchedAt: true,
        playerWallet: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Only reveal seed if ticket has been scratched
    const isScratched = ["scratched", "paid"].includes(ticket.status);

    return NextResponse.json({
      ticketId: ticket.id,
      tier: ticket.tier,
      priceLamports: ticket.priceLamports.toString(),
      seedHash: ticket.seedHash,
      seed: isScratched ? ticket.seed : null,
      zone1Result: isScratched ? ticket.zone1Result : null,
      zone2Result: isScratched ? ticket.zone2Result : null,
      zone3Result: isScratched ? ticket.zone3Result : null,
      totalPayoutLamports: ticket.totalPayoutLamports.toString(),
      payoutTx: ticket.payoutTx,
      depositTx: ticket.depositTx,
      status: ticket.status,
      scratchedAt: ticket.scratchedAt,
      playerWallet: truncateWallet(ticket.playerWallet),
    });
  } catch (error) {
    console.error("Error in /api/tickets/verify:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
