import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { requireWallet } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const wallet = requireWallet(request).wallet;

    // Return existing code if wallet already has one
    const existing = await prisma.referralCode.findUnique({
      where: { wallet },
    });
    if (existing) {
      const count = await prisma.referral.count({ where: { referrerWallet: wallet } });
      return NextResponse.json({ code: existing.code, referralCount: count });
    }

    // Generate unique random code with collision retry
    let code: string;
    let attempts = 0;
    do {
      code = crypto.randomBytes(4).toString("hex");
      const collision = await prisma.referralCode.findUnique({ where: { code } });
      if (!collision) break;
      attempts++;
    } while (attempts < 5);

    // Store the code
    await prisma.referralCode.create({
      data: { wallet, code },
    });

    return NextResponse.json({ code, referralCount: 0 });
  } catch (error) {
    console.error("Error in /api/referral/code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
