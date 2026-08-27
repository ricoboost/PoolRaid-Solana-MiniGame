"use client";

import { useState } from "react";

interface LeaderEntry {
  wallet: string;
  value: string;
  sub?: string;
}

interface LeaderboardData {
  biggestAllTime: LeaderEntry[];
  biggestToday: LeaderEntry[];
  biggestWeek: LeaderEntry[];
  topScratchers: LeaderEntry[];
  luckiest: LeaderEntry[];
  topStreaks: LeaderEntry[];
  topLevels: LeaderEntry[];
  flipBiggestAllTime: LeaderEntry[];
  flipBiggestToday: LeaderEntry[];
  flipBiggestWeek: LeaderEntry[];
  flipMostActive: LeaderEntry[];
  flipLuckiest: LeaderEntry[];
}

const GAME_FILTERS = [
  { key: "global", label: "Global" },
  { key: "scratch", label: "Scratch" },
  { key: "flip", label: "Coin Flip" },
] as const;

const TABS = [
  { key: "biggest", label: "Biggest Wins" },
  { key: "volume", label: "Most Active" },
  { key: "streaks", label: "Streaks & XP" },
] as const;

const TIME_TABS = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "all", label: "All Time" },
] as const;

function mergeAndSort(a: LeaderEntry[], b: LeaderEntry[]): LeaderEntry[] {
  return [...a, ...b]
    .sort((x, y) => parseFloat(y.value) - parseFloat(x.value))
    .slice(0, 10);
}

export function LeaderboardTabs({ data }: { data: LeaderboardData }) {
  const [gameFilter, setGameFilter] = useState<string>("global");
  const [tab, setTab] = useState<string>("biggest");
  const [timeTab, setTimeTab] = useState<string>("all");

  // Resolve biggest wins based on game filter + time
  const getBiggest = () => {
    const scratchData = timeTab === "today" ? data.biggestToday : timeTab === "week" ? data.biggestWeek : data.biggestAllTime;
    const flipData = timeTab === "today" ? data.flipBiggestToday : timeTab === "week" ? data.flipBiggestWeek : data.flipBiggestAllTime;

    if (gameFilter === "scratch") return scratchData;
    if (gameFilter === "flip") return flipData;
    return mergeAndSort(scratchData, flipData);
  };

  // Resolve most active
  const getActive = () => {
    if (gameFilter === "scratch") return [
      { title: "Most Tickets Scratched", entries: data.topScratchers },
      { title: "Highest Total Won", entries: data.luckiest },
    ];
    if (gameFilter === "flip") return [
      { title: "Most Flips Played", entries: data.flipMostActive },
      { title: "Highest Total Won", entries: data.flipLuckiest },
    ];
    return [
      { title: "Most Tickets Scratched", entries: data.topScratchers },
      { title: "Most Flips Played", entries: data.flipMostActive },
      { title: "Highest Won (Scratch)", entries: data.luckiest },
      { title: "Highest Won (Flip)", entries: data.flipLuckiest },
    ];
  };

  return (
    <div>
      {/* Game filter */}
      <div className="flex gap-1 mb-4">
        {GAME_FILTERS.map((g) => (
          <button
            key={g.key}
            onClick={() => setGameFilter(g.key)}
            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-[0.05em] transition-all cursor-pointer ${
              gameFilter === g.key
                ? "bg-primary text-on-primary"
                : "text-text-muted bg-surface-container hover:text-on-surface-variant"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Main tabs */}
      <div className="flex gap-1.5 mb-5">
        {TABS.filter((t) => {
          // Hide Streaks & XP for flip-only filter (no streaks in flip)
          if (gameFilter === "flip" && t.key === "streaks") return false;
          return true;
        }).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-lg font-mono text-[11px] font-bold uppercase tracking-[0.05em] transition-all cursor-pointer ${
              tab === t.key
                ? "bg-primary/10 text-primary"
                : "text-text-muted bg-surface-container hover:text-on-surface-variant"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "biggest" && (
        <>
          <div className="flex gap-1.5 mb-4">
            {TIME_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeTab(t.key)}
                className={`px-4 py-1.5 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  timeTab === t.key
                    ? "bg-surface-high text-on-surface"
                    : "text-text-muted hover:text-on-surface-variant"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <LeaderList entries={getBiggest()} emptyText="No wins yet" />
        </>
      )}

      {tab === "volume" && (
        <div className="space-y-6">
          {getActive().map((section) => (
            <CategorySection key={section.title} title={section.title} entries={section.entries} />
          ))}
        </div>
      )}

      {tab === "streaks" && (
        <div className="space-y-6">
          <CategorySection title="Best Win Streaks" entries={data.topStreaks} />
          <CategorySection title="Highest Level" entries={data.topLevels} />
        </div>
      )}
    </div>
  );
}

function CategorySection({ title, entries }: { title: string; entries: LeaderEntry[] }) {
  return (
    <div>
      <h3 className="font-display text-[13px] font-bold text-on-surface mb-3">{title}</h3>
      <LeaderList entries={entries} emptyText="No data yet" />
    </div>
  );
}

function LeaderList({ entries, emptyText }: { entries: LeaderEntry[]; emptyText: string }) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 rounded-xl bg-surface-container">
        <p className="font-mono text-[12px] text-text-muted">{emptyText}</p>
      </div>
    );
  }

  const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];

  return (
    <div className="rounded-xl overflow-hidden">
      {entries.map((entry, i) => (
        <div
          key={`${entry.wallet}-${i}`}
          className={`flex items-center justify-between px-4 py-3 ${
            i % 2 === 0 ? "bg-surface-container" : "bg-surface-lowest"
          } ${i < 3 ? "bg-primary/[0.03]" : ""}`}
        >
          <div className="flex items-center gap-3">
            <span className="font-display text-[14px] font-bold w-7 text-center">
              {i < 3 ? medals[i] : <span className="text-text-muted text-[12px]">#{i + 1}</span>}
            </span>
            <div>
              <span className={`font-mono text-[12px] font-semibold ${i < 3 ? "text-on-surface" : "text-on-surface-variant"}`}>
                {entry.wallet}
              </span>
              {entry.sub && (
                <span className="ml-2 font-mono text-[10px] text-text-muted">{entry.sub}</span>
              )}
            </div>
          </div>
          <span className={`font-display text-[13px] font-extrabold ${i < 3 ? "text-primary" : "text-on-surface-variant"}`}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
