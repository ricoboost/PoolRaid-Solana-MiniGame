import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";
import { connection, getPoolKeypair } from "@/lib/solana";
import { isValidTier } from "@/lib/security";
import { solToLamports } from "@/lib/money";

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { tier, amount } = await request.json();

  if (!tier || !isValidTier(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  let amountLamports: bigint;
  try { amountLamports = solToLamports(String(amount)); } catch { amountLamports = 0n; }
  if (amountLamports <= 0n || amountLamports > 100_000_000_000n) {
    return NextResponse.json({ error: "Invalid amount (0-100 SOL)" }, { status: 400 });
  }

  // Verify hot wallet has enough balance
  try {
    const keypair = getPoolKeypair();
    const balance = await connection.getBalance(keypair.publicKey);
    const available = BigInt(balance) - 10_000_000n;
    if (amountLamports > available) {
      return NextResponse.json({
        error: "Insufficient hot wallet balance after fee reserve",
      }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Cannot check wallet balance" }, { status: 500 });
  }

  try {
    // Add directly to pool balance (no on-chain transfer needed — funds are already in hot wallet)
    await prisma.$transaction(async (tx) => {
      await tx.pool.update({
        where: { tier },
        data: {
          balanceLamports: { increment: amountLamports },
          totalInLamports: { increment: amountLamports },
        },
      });
    });

    await prisma.adminLog.create({
      data: {
        action: "seed_pool",
        details: `Seeded ${amountLamports} lamports into ${tier} pool`,
      },
    });

    return NextResponse.json({ success: true, tier, amountLamports: amountLamports.toString() });
  } catch (err) {
    console.error("Seed pool failed:", err);
    return NextResponse.json({ error: "Failed to seed pool" }, { status: 500 });
  }
}
