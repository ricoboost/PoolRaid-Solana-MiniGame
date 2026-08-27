"use client";

import { useState, useMemo } from "react";
import { useFlipRooms } from "@/hooks/useFlipRooms";
import { FlipTierTabs } from "./FlipTierTabs";
import { FlipRoomGrid } from "./FlipRoomGrid";
import { FlipSidebar } from "./FlipSidebar";
import { FlipFeed } from "./FlipFeed";
import type { FlipTier } from "@/types";

export function FlipPage() {
  const [selectedTier, setSelectedTier] = useState<FlipTier>(0.1);
  const { rooms, connected } = useFlipRooms(selectedTier);

  // Count active rooms per tier for tab indicators
  const roomCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const room of rooms) {
      if (room.status !== "empty") {
        counts[room.tier] = (counts[room.tier] || 0) + 1;
      }
    }
    return counts;
  }, [rooms]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] overflow-x-hidden">
      {/* Sidebar (desktop only) — left side like other pages */}
      <FlipSidebar selectedTier={selectedTier} />

      {/* Main content */}
      <main className="flex-1 px-3 md:px-4 lg:px-6 py-3 md:py-4 max-w-[960px] min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-display text-[18px] md:text-[20px] font-black text-on-surface">
              Coin Flip
            </h1>
            <p className="font-mono text-[10px] md:text-[11px] text-text-muted">
              PVP &middot; 50/50 &middot; Winner takes all
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!connected && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-lose/50 animate-pulse" />
                <span className="font-mono text-[9px] text-lose/60">Reconnecting...</span>
              </div>
            )}
            {connected && (
              <div className="flex items-center gap-1.5">
                <span className="relative w-[5px] h-[5px]">
                  <span className="absolute inset-0 rounded-full bg-primary animate-[livePulse_2s_ease-in-out_infinite]" />
                </span>
                <span className="font-mono text-[9px] text-primary/60">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Tier tabs */}
        <FlipTierTabs
          selectedTier={selectedTier}
          onSelect={setSelectedTier}
          roomCounts={roomCounts}
        />

        {/* Room grid */}
        <div className="mt-3">
          <FlipRoomGrid rooms={rooms} />
        </div>

        {/* Mobile feed (hidden on desktop, shown below grid on mobile) */}
        <div className="lg:hidden mt-4 mb-4">
          <FlipFeed />
        </div>
      </main>
    </div>
  );
}
