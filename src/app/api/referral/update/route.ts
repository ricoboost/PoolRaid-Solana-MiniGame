import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWallet } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const wallet = requireWallet(request).wallet;
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    // Validate: 4-20 chars, alphanumeric only, lowercase
    const clean = code.toLowerCase().trim();
    if (!/^[a-z0-9]{4,20}$/.test(clean)) {
      return NextResponse.json({ error: "Code must be 4-20 characters, letters and numbers only" }, { status: 400 });
    }

    // Must have an existing code to update
    const existing = await prisma.referralCode.findUnique({ where: { wallet } });
    if (!existing) {
      return NextResponse.json({ error: "Generate a code first" }, { status: 400 });
    }

    // Check if custom code is already taken
    const taken = await prisma.referralCode.findUnique({ where: { code: clean } });
    if (taken && taken.wallet !== wallet) {
      return NextResponse.json({ error: "Code already taken" }, { status: 409 });
    }

    // Update the code
    await prisma.referralCode.update({
      where: { wallet },
      data: { code: clean },
    });

    return NextResponse.json({ code: clean });
  } catch (error) {
    console.error("Error in /api/referral/update:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
