import { NextResponse } from "next/server";
import { createAuthChallenge, assertSameOrigin } from "@/lib/auth";
import { isValidSolanaAddress } from "@/lib/security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { wallet, purpose = "player" } = await request.json();
    if (!isValidSolanaAddress(wallet) || !["player", "admin"].includes(purpose)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json(await createAuthChallenge(wallet, purpose));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
