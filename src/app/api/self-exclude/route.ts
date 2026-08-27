import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWallet } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const walletAddress = requireWallet(request).wallet;
    const { duration } = await request.json();

    const validDurations = ["24h", "7d", "30d", "permanent"];
    if (!duration || !validDurations.includes(duration)) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    // Check for existing permanent exclusion
    const existing = await prisma.selfExclusion.findFirst({
      where: { walletAddress, isPermanent: true },
    });
    if (existing) {
      return NextResponse.json({ error: "Wallet is already permanently excluded" }, { status: 400 });
    }

    let excludeUntil: Date;
    let isPermanent = false;

    switch (duration) {
      case "24h":
        excludeUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        break;
      case "7d":
        excludeUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        excludeUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        break;
      case "permanent":
        excludeUntil = new Date("2099-12-31");
        isPermanent = true;
        break;
      default:
        excludeUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    await prisma.selfExclusion.create({
      data: { walletAddress, excludeUntil, isPermanent },
    });

    return NextResponse.json({
      walletAddress,
      excludeUntil: excludeUntil.toISOString(),
      isPermanent,
    });
  } catch (error) {
    console.error("Error in /api/self-exclude:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
