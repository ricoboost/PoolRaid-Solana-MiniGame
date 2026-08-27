import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWallet } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const wallet = requireWallet(request).wallet;

    const tickets = await prisma.ticket.findMany({
      where: {
        playerWallet: wallet,
        status: "funded",
        isFreeTicket: true,
      },
      orderBy: { createdAt: "asc" }, // FIFO — oldest first
      select: {
        id: true,
        tier: true,
        priceLamports: true,
        createdAt: true,
      },
    });

    return NextResponse.json(tickets.map((ticket) => ({
      ...ticket,
      priceLamports: ticket.priceLamports.toString(),
      price: Number(ticket.priceLamports) / 1_000_000_000,
    })));
  } catch (error) {
    if (error instanceof Error && ["Unauthorized", "Invalid origin"].includes(error.message)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/tickets/available:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
