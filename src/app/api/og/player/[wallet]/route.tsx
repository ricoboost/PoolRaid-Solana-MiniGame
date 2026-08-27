import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { formatLamports } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  const { wallet } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  let name = "Player";
  let won = 0n;
  let rate = "0";
  let lvl = 0;

  try {
    const profile = await prisma.playerProfile.findUnique({ where: { wallet } });
    if (profile) {
      name = profile.displayName || "Player " + wallet.slice(0, 6);
      lvl = profile.level;
    }
    const tickets = await prisma.ticket.findMany({
      where: { playerWallet: wallet, status: { in: ["scratched", "paid"] } },
      select: { totalPayoutLamports: true },
    });
    won = tickets.reduce((sum, ticket) => sum + ticket.totalPayoutLamports, 0n);
    const wins = tickets.filter((ticket) => ticket.totalPayoutLamports > 0n).length;
    if (tickets.length > 0) rate = ((wins / tickets.length) * 100).toFixed(1);
  } catch {
    // fallback
  }

  const trunc = wallet.slice(0, 4) + "..." + wallet.slice(-4);
  const fmtWon = formatLamports(won);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
        <img alt="" src={`${appUrl}/images/brand/bg_og.png`} width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "60px 60px", flex: 1, zIndex: 1 }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#f0ece7", marginBottom: 8 }}>{name}</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
            <span style={{ fontSize: 18, color: "#585555" }}>{trunc}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#34fea0", background: "rgba(52,254,160,0.15)", padding: "4px 14px", borderRadius: 8 }}>Lv.{lvl}</span>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", padding: "14px 22px", borderRadius: 12, backgroundColor: "rgba(26,25,25,0.8)" }}>
              <span style={{ fontSize: 10, color: "#585555" }}>TOTAL WON</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#34fea0" }}>{fmtWon} SOL</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", padding: "14px 22px", borderRadius: 12, backgroundColor: "rgba(26,25,25,0.8)" }}>
              <span style={{ fontSize: 10, color: "#585555" }}>WIN RATE</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#b984ff" }}>{rate}%</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
