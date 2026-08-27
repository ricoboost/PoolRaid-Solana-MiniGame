import type { Zone1Result, Zone2Result, Zone3Result } from "@/types";

export interface LevelDef {
  level: number;
  name: string;
  xpRequired: number;
}

export const LEVELS: LevelDef[] = [
  { level: 0, name: "Rookie", xpRequired: 0 },
  { level: 1, name: "Player", xpRequired: 100 },
  { level: 2, name: "Regular", xpRequired: 500 },
  { level: 3, name: "Veteran", xpRequired: 2000 },
  { level: 4, name: "High Roller", xpRequired: 5000 },
  { level: 5, name: "Whale", xpRequired: 15000 },
  { level: 6, name: "Legend", xpRequired: 50000 },
];

export function getLevelForXp(xp: number): LevelDef {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(currentLevel: number): LevelDef | null {
  return LEVELS[currentLevel + 1] ?? null;
}

export function calculateXpGain(
  zone1: Zone1Result,
  zone2: Zone2Result,
  zone3: Zone3Result,
  totalPayoutLamports: bigint,
  newAchievementCount: number
): number {
  let xp = 10; // base XP for playing

  if (totalPayoutLamports > 0n) {
    xp += 25; // any win
    if (zone1.multiplier >= 1.0) xp += 50;
    if (zone1.multiplier >= 1.5) xp += 100;
  }

  if (zone2.poolPct > 0) xp += 200; // hit a raid

  if (zone3.type !== "nothing") xp += 30; // free ticket

  xp += newAchievementCount * 500; // achievements

  return xp;
}
