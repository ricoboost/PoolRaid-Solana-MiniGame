import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { action, tier } = await request.json();

  if (action === "pause_all") {
    await prisma.gameConfig.updateMany({ data: { isActive: false } });
    await prisma.adminLog.create({ data: { action: "pause_all" } });
  } else if (action === "resume_all") {
    await prisma.gameConfig.updateMany({ data: { isActive: true } });
    await prisma.adminLog.create({ data: { action: "resume_all" } });
  } else if (action === "pause_tier" && tier) {
    await prisma.gameConfig.update({ where: { tier }, data: { isActive: false } });
    await prisma.adminLog.create({ data: { action: "pause_tier", details: tier } });
  } else if (action === "resume_tier" && tier) {
    await prisma.gameConfig.update({ where: { tier }, data: { isActive: true } });
    await prisma.adminLog.create({ data: { action: "resume_tier", details: tier } });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const configs = await prisma.gameConfig.findMany();
  const pausedTiers = configs.filter((c) => !c.isActive).map((c) => c.tier);

  return NextResponse.json({ success: true, status: { salesPaused: pausedTiers.length === 6, pausedTiers } });
}
