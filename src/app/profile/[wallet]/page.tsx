import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getLevelForXp } from "@/lib/xp";
import { ProfileClient } from "./ProfileClient";
import { ProfileSidebar } from "./ProfileSidebar";
import { truncateWallet } from "@/lib/utils";

interface Props {
  params: Promise<{ wallet: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { wallet } = await params;
  const profile = await prisma.playerProfile.findUnique({ where: { wallet } });
  const name = profile?.displayName || `Player ${wallet.slice(0, 6)}`;
  const level = profile ? getLevelForXp(profile.totalXp) : { name: "Rookie" };

  return {
    title: `${name} (${truncateWallet(wallet)}) — PoolRaid`,
    description: `${name} on PoolRaid · ${level.name} · Provably fair gaming on Solana`,
    openGraph: {
      images: [`/api/og/player/${wallet}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/api/og/player/${wallet}`],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { wallet } = await params;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <ProfileSidebar />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[900px] mx-auto w-full">
        <ProfileClient wallet={wallet} />
      </main>
    </div>
  );
}
