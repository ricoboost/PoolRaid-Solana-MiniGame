"use client";

import { FlipRoomCard } from "./FlipRoomCard";
import type { FlipRoomState } from "@/types";

interface Props {
  rooms: FlipRoomState[];
}

export function FlipRoomGrid({ rooms }: Props) {
  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-mono text-[11px] text-text-muted">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {rooms.map((room) => (
        <FlipRoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
