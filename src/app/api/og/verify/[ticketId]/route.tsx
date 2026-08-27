import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { formatLamports } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { tier: true, priceLamports: true, totalPayoutLamports: true, zone1Result: true, playerWallet: true },
  });

  const payoutLamports = ticket?.totalPayoutLamports ?? 0n;
  const isWin = payoutLamports > 0n;
  const isBigWin = ticket ? payoutLamports >= ticket.priceLamports * 3n : false;
  const tier = ticket?.tier ?? "unknown";
  const priceLamports = ticket?.priceLamports ?? 0n;
  const mult = priceLamports > 0n ? (Number(payoutLamports * 10n / priceLamports) / 10).toFixed(1) : "0";
  const wallet = ticket?.playerWallet ? `${ticket.playerWallet.slice(0, 4)}...${ticket.playerWallet.slice(-4)}` : "---";
  const z1 = ticket?.zone1Result as { label?: string } | null;

  const accent = isBigWin ? "#ffe792" : isWin ? "#34fea0" : "#ff4466";
  const badge = isBigWin ? "BIG WIN" : isWin ? "WINNER" : "SCRATCHED";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
        {/* Background image */}
        <img alt="" src={`${appUrl}/images/brand/bg_og.png`} width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />

        {/* Content overlay */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "60px 60px", flex: 1, zIndex: 1 }}>
          {/* Badge */}
          <div style={{ display: "flex", marginBottom: 24 }}>
            <div style={{ padding: "8px 20px", borderRadius: 10, background: isWin ? "rgba(52,254,160,0.15)" : "rgba(255,68,102,0.15)", color: accent, fontSize: 16, fontWeight: 900, letterSpacing: "0.12em" }}>{badge}</div>
          </div>

          {/* Payout */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 10 }}>
            <span style={{ fontSize: 88, fontWeight: 900, color: accent, lineHeight: "1" }}>
              {isWin ? `+${formatLamports(payoutLamports)}` : "0"}
            </span>
            <span style={{ fontSize: 36, fontWeight: 800, color: "#585555" }}>SOL</span>
          </div>

          {/* Tier */}
          <div style={{ display: "flex", fontSize: 20, color: "#8a8686", marginBottom: 32, textTransform: "capitalize" }}>
            {tier} tier {z1?.label ? ` · ${z1.label}` : ""}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", padding: "12px 20px", borderRadius: 12, backgroundColor: "rgba(26,25,25,0.8)" }}>
              <span style={{ fontSize: 10, color: "#585555", textTransform: "uppercase", marginBottom: 4 }}>TICKET</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#c4c0bc" }}>{formatLamports(priceLamports)} SOL</span>
            </div>
            {isWin && (
              <div style={{ display: "flex", flexDirection: "column", padding: "12px 20px", borderRadius: 12, backgroundColor: "rgba(26,25,25,0.8)" }}>
                <span style={{ fontSize: 10, color: "#585555", textTransform: "uppercase", marginBottom: 4 }}>RETURN</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: accent }}>{mult}x</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", padding: "12px 20px", borderRadius: 12, backgroundColor: "rgba(26,25,25,0.8)" }}>
              <span style={{ fontSize: 10, color: "#585555", textTransform: "uppercase", marginBottom: 4 }}>PLAYER</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#c4c0bc" }}>{wallet}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
