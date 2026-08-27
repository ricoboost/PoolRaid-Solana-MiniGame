import { NextResponse } from "next/server";
import { getRoomsForTier } from "@/lib/flip/flipService";
import { isValidFlipTier } from "@/lib/flip/flipTiers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tier: string }> }
) {
  try {
    const { tier: tierStr } = await params;
    const tier = parseFloat(tierStr);

    if (isNaN(tier) || !isValidFlipTier(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const rooms = await getRoomsForTier(tier);
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Error in /api/flip/rooms:", error instanceof Error ? error.message : error, error instanceof Error ? error.stack : "");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
