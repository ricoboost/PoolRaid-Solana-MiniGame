import { FlipPage } from "@/components/flip/FlipPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Coin Flip — PoolRaid",
  description: "PVP coin flip on Solana. Pick a tier, sit in a room, flip for 2x.",
};

export default function Flip() {
  return <FlipPage />;
}
