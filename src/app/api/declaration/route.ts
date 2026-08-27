import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWallet } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const walletAddress = requireWallet(request).wallet;

    // Get country from Cloudflare header (if available)
    const ipCountry = request.headers.get("cf-ipcountry") || "unknown";

    // Create declaration if wallet hasn't declared before (race-safe)
    try {
      await prisma.userDeclaration.upsert({
        where: { walletAddress },
        update: { ipCountry, declaredAt: new Date() },
        create: { walletAddress, ipCountry },
      });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in /api/declaration:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
