export type Tier = "micro" | "mini" | "standard" | "gold" | "diamond" | "black";

export interface TierConfig {
  tier: Tier;
  ticketPrice: number;
  ticketPriceLamports: bigint;
  emoji: string;
  label: string;
}

export type TicketStatus = "pending" | "funded" | "scratched" | "paid" | "failed";

export interface Zone1Result {
  label: string;
  multiplier: number;
  payoutLamports: string;
  capped: boolean;
  rawPayoutLamports: string;
}

export interface Zone2Result {
  label: string;
  poolPct: number;
  payoutLamports: string;
}

export interface Zone3Result {
  label: string;
  type: "free_same" | "free_up" | "nothing";
  tier?: string;
}

export interface ScratchResult {
  zone1: Zone1Result;
  zone2: Zone2Result;
  zone3: Zone3Result;
  totalPayoutLamports: string;
  payoutTx?: string;
  seed: string;
  freeTicketId?: string;
  freeTicketTier?: string;
  currentStreak?: number;
  bestStreak?: number;
  xpGained?: number;
  totalXp?: number;
  level?: number;
  newAchievements?: { id: string; name: string; icon: string }[];
}

export interface PlayerProfileData {
  wallet: string;
  displayName: string | null;
  isPublic: boolean;
  currentStreak: number;
  bestStreak: number;
  totalXp: number;
  level: number;
  totalWagered: number;
  totalWon: number;
  netPnl: number;
  totalTickets: number;
  winRate: number;
  achievements: { achievementId: string; unlockedAt: string }[];
}

export interface PoolData {
  tier: Tier;
  balance: number;
  rawBalance: number;
  totalIn: number;
  totalOut: number;
  ticketCount: number;
  ticketPrice: number;
  isActive: boolean;
  bootstrapPhase: "seeding" | "growing" | "mature";
  houseCutPct: number;
  ticketsToNextPhase: number;
  isLocked: boolean;
}

export interface FeedItem {
  wallet: string;
  amount: number;
  type: string;
  tier: Tier;
  timestamp: string;
}

export interface BuyResponse {
  ticketId: string;
  seedHash: string;
  depositAddress: string;
  amountLamports: string;
  memo: string;
  expiresAt: string;
}

export interface ConfirmResponse {
  ticketId: string;
  status: "funded";
}

// Flip types
export type FlipTier = 0.001 | 0.01 | 0.05 | 0.1 | 0.5 | 1 | 5 | 10 | 50 | 100;
export type FlipRoomStatus = "empty" | "reserving" | "waiting" | "matching" | "matched" | "flipping" | "completed" | "refunding" | "cancelled";

export interface FlipRoomState {
  id: string;
  roomSlot: number;
  tier: FlipTier;
  status: FlipRoomStatus;
  playerAWallet: string | null;
  playerASide: "heads" | "tails" | null;
  playerBWallet: string | null;
  playerBSide: "heads" | "tails" | null;
  serverSeedHash: string | null;
  serverSeed: string | null;
  result: "heads" | "tails" | null;
  winnerWallet: string | null;
  payoutAmount: number | null;
  payoutTx: string | null;
  payoutStatus?: string | null;
  houseRake: number | null;
  playerASeatedAt: string | null;
  playerBSeatedAt: string | null;
}

export interface FlipHistoryItem {
  id: string;
  tier: FlipTier;
  playerAWallet: string;
  playerBWallet: string;
  winnerWallet: string;
  result: "heads" | "tails";
  potAmount: number;
  payoutAmount: number;
  payoutTx: string | null;
  serverSeedHash: string;
  completedAt: string;
}
