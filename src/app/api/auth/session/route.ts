import { NextResponse } from "next/server";
import { SESSION_COOKIE, assertSameOrigin, getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = getSession(request);
  return session ? NextResponse.json(session) : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
