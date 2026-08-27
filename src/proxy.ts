import { NextRequest, NextResponse } from "next/server";

const HARD_BLOCKED = [
  "FR", "TH", "GB", "AU", "NL", "SG", "CN", "IR", "IQ", "AF", "KP",
  "SA", "AE", "QA", "KW", "BH", "OM", "MY", "ID", "BD",
];

const ALLOWED_PATHS = [
  "/blocked",
  "/terms",
  "/privacy",
  "/responsible-gaming",
];

const BLOCKED_PUBLIC_APIS = [
  "/api/health",
  "/api/feed",
  "/api/pools",
  "/api/tickets/verify/",
  "/api/flip/verify/",
];

// Common admin paths — honeypot
const HONEYPOT_PATHS = ["/admin", "/dashboard", "/panel", "/login", "/wp-admin", "/wp-login"];

export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const country = (request.headers.get("cf-ipcountry") || "").toUpperCase();

  // Honeypot — log probes for common admin paths
  if (HONEYPOT_PATHS.some((p) => path === p || path.startsWith(p + "/"))) {
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
    console.warn(`[HONEYPOT] Admin probe from ${ip} — path: ${path}`);
    return NextResponse.next(); // Falls through to Next.js 404
  }

  // Always allow legal pages and static assets.
  if (
    ALLOWED_PATHS.some((p) => path === p) ||
    path.startsWith("/_next") ||
    path.includes(".")
  ) {
    return NextResponse.next();
  }

  // Block state-changing game APIs as well as pages. This is a coarse deployment
  // safeguard, not a substitute for legal review or edge-level access controls.
  if (country && HARD_BLOCKED.includes(country)) {
    if (path.startsWith("/api/")) {
      if (BLOCKED_PUBLIC_APIS.some((allowed) => path === allowed || path.startsWith(allowed))) {
        return NextResponse.next();
      }
      return NextResponse.json({ error: "Unavailable in your region" }, { status: 451 });
    }
    return NextResponse.redirect(new URL("/blocked", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
