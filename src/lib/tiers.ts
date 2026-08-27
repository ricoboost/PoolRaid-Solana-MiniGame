import type { Tier, TierConfig } from "@/types";

export const TIERS: TierConfig[] = [
  { tier: "micro", ticketPrice: 0.001, ticketPriceLamports: 1_000_000n, emoji: "\u{1F7E2}", label: "Micro" },
  { tier: "mini", ticketPrice: 0.01, ticketPriceLamports: 10_000_000n, emoji: "\u{1F535}", label: "Mini" },
  { tier: "standard", ticketPrice: 0.1, ticketPriceLamports: 100_000_000n, emoji: "\u{1F7E3}", label: "Standard" },
  { tier: "gold", ticketPrice: 1, ticketPriceLamports: 1_000_000_000n, emoji: "\u{1F7E1}", label: "Gold" },
  { tier: "diamond", ticketPrice: 5, ticketPriceLamports: 5_000_000_000n, emoji: "\u{1F534}", label: "Diamond" },
  { tier: "black", ticketPrice: 10, ticketPriceLamports: 10_000_000_000n, emoji: "\u26AB", label: "Black" },
];

export const TIER_ORDER: Tier[] = ["micro", "mini", "standard", "gold", "diamond", "black"];

export function getTierConfig(tier: Tier): TierConfig {
  return TIERS.find((t) => t.tier === tier)!;
}

export function getNextTier(tier: Tier): Tier | null {
  const idx = TIER_ORDER.indexOf(tier);
  return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
}

/**
 * Metallic gradient border per tier — used on scratch cards.
 * Each returns a CSS conic-gradient that simulates brushed metal.
 */
export function getTierGradient(tier: Tier): string {
  const gradients: Record<Tier, string> = {
    micro: "conic-gradient(from 0deg, #34fea0, #1a7a50, #34fea0, #0d3d28, #34fea0)",
    mini: "conic-gradient(from 0deg, #60b0ff, #2a5a8a, #60b0ff, #1a3d5c, #60b0ff)",
    standard: "conic-gradient(from 0deg, #b984ff, #5a3d8a, #b984ff, #2a1f3d, #b984ff)",
    gold: "conic-gradient(from 0deg, #ffe792, #b8942a, #ffe792, #7d6528, #ffe792)",
    diamond: "conic-gradient(from 0deg, #ff6b8a, #8a2a3d, #ff6b8a, #5c1a28, #ff6b8a)",
    black: "conic-gradient(from 0deg, #e6e1dc, #6b6868, #e6e1dc, #3d3b3b, #e6e1dc)",
  };
  return gradients[tier];
}

export function getTierColor(tier: Tier): { main: string; dark: string } {
  const colors: Record<Tier, { main: string; dark: string }> = {
    micro: { main: "#34fea0", dark: "#1a7a50" },
    mini: { main: "#60b0ff", dark: "#1a3d5c" },
    standard: { main: "#b984ff", dark: "#2a1f3d" },
    gold: { main: "#ffe792", dark: "#7d6528" },
    diamond: { main: "#ff6b8a", dark: "#5c1a28" },
    black: { main: "#e6e1dc", dark: "#3d3b3b" },
  };
  return colors[tier];
}

export function getTierGlow(tier: Tier): string {
  const glows: Record<Tier, string> = {
    micro: "rgba(52, 254, 160, 0.15)",
    mini: "rgba(96, 176, 255, 0.15)",
    standard: "rgba(185, 132, 255, 0.15)",
    gold: "rgba(255, 231, 146, 0.20)",
    diamond: "rgba(255, 107, 138, 0.15)",
    black: "rgba(230, 225, 220, 0.12)",
  };
  return glows[tier];
}
