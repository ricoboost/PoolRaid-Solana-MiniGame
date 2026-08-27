import type { Metadata } from "next";
import { ReferralRedirect } from "./ReferralRedirect";

interface Props {
  params: Promise<{ code: string }>;
}

export function generateMetadata(): Metadata {
  return {
    title: "Join PoolRaid — Scratch & Flip on Solana",
    description: "A self-hosted, verifiable scratch-card and peer coin-flip application for Solana.",
    openGraph: {
      images: [{ url: "/og-image.webp", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/og-image.webp"],
    },
  };
}

export default async function ReferralPage({ params }: Props) {
  const { code } = await params;
  return <ReferralRedirect code={code} />;
}
