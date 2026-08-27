import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const tiers = [
  { tier: "micro", ticketPriceLamports: 1_000_000n },
  { tier: "mini", ticketPriceLamports: 10_000_000n },
  { tier: "standard", ticketPriceLamports: 100_000_000n },
  { tier: "gold", ticketPriceLamports: 1_000_000_000n },
  { tier: "diamond", ticketPriceLamports: 5_000_000_000n },
  { tier: "black", ticketPriceLamports: 10_000_000_000n },
];

async function main() {
  for (const t of tiers) {
    await prisma.gameConfig.upsert({
      where: { tier: t.tier },
      update: { ticketPriceLamports: t.ticketPriceLamports },
      create: {
        tier: t.tier,
        ticketPriceLamports: t.ticketPriceLamports,
        houseCutBps: 1000,
        bootstrapCount: 100,
        isActive: true,
      },
    });

    await prisma.pool.upsert({
      where: { tier: t.tier },
      update: {},
      create: {
        tier: t.tier,
        balanceLamports: 0n,
        totalInLamports: 0n,
        totalOutLamports: 0n,
        ticketCount: 0,
      },
    });
  }

  const houseCount = await prisma.houseProfit.count();
  if (houseCount === 0) {
    await prisma.houseProfit.create({
      data: { totalProfitLamports: 0n },
    });
  }

  // Seed flip rooms (6 rooms per tier, 10 tiers = 60 rooms)
  const flipTiersLamports = [1_000_000n, 10_000_000n, 50_000_000n, 100_000_000n, 500_000_000n, 1_000_000_000n, 5_000_000_000n, 10_000_000_000n, 50_000_000_000n, 100_000_000_000n];
  for (const tierLamports of flipTiersLamports) {
    for (let slot = 1; slot <= 6; slot++) {
      await prisma.flipRoom.upsert({
        where: { roomSlot_tierLamports: { roomSlot: slot, tierLamports } },
        update: {},
        create: { roomSlot: slot, tierLamports, status: "empty" },
      });
    }
  }

  console.log("Seeded PoolRaid configs, pools, accounting, and 60 flip rooms.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
