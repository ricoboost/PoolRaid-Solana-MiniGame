import { NextResponse } from "next/server";
import { SESSION_COOKIE, assertSameOrigin, issueSession, sessionCookieOptions, verifyAuthChallenge } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { challengeId, signature } = await request.json();
    if (typeof challengeId !== "string" || typeof signature !== "string") throw new Error("Unauthorized");
    const session = await verifyAuthChallenge(challengeId, signature);
    const response = NextResponse.json({ wallet: session.wallet, role: session.role });
    response.cookies.set(SESSION_COOKIE, issueSession(session), sessionCookieOptions(session.role));
    return response;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
