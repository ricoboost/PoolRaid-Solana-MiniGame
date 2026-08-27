import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import { EntryGate } from "@/components/EntryGate";
import { TopBar } from "@/components/TopBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PoolRaid — Scratch & Flip on Solana",
  description: "A self-hosted, verifiable scratch-card and peer coin-flip application for Solana.",
  applicationName: "PoolRaid",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "PoolRaid",
    title: "PoolRaid — Scratch & Flip on Solana",
    description: "A self-hosted, verifiable scratch-card and peer coin-flip application for Solana.",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "PoolRaid — Scratch & Flip on Solana" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PoolRaid — Scratch & Flip on Solana",
    description: "A self-hosted, verifiable scratch-card and peer coin-flip application for Solana.",
    images: ["/og-image.webp"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakarta.variable} ${ibmPlexMono.variable}`}
    >
      <body className="bg-surface text-on-surface-variant font-body min-h-screen">
        <Providers>
          <EntryGate>
            <TopBar />
            <div className="flex-1 pb-16 md:pb-0">{children}</div>
            <MobileBottomNav />
          </EntryGate>
        </Providers>
      </body>
    </html>
  );
}
