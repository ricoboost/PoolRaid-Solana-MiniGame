"use client";

import { useState } from "react";
import { useSoundUI } from "@/hooks/useSound";

export function SoundControl() {
  const { muted, setMuted, volume, setVolume } = useSoundUI();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="flex items-center gap-1.5 rounded-md hover:bg-surface-bright/50 transition-all"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Volume slider — slides in from the left on hover */}
      <div className={`flex items-center gap-2 overflow-hidden transition-all duration-200 ${expanded && !muted ? "w-24 opacity-100 pl-2" : "w-0 opacity-0"}`}>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(volume * 100)}
          onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
          className="w-full h-1 accent-primary cursor-pointer"
        />
        <span className="font-mono text-[8px] text-primary font-bold whitespace-nowrap">{Math.round(volume * 100)}</span>
      </div>

      {/* Speaker icon — click to mute */}
      <button
        onClick={() => setMuted(!muted)}
        className="p-1.5 rounded-md text-text-muted hover:text-on-surface-variant transition-all cursor-pointer"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            {volume > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
          </svg>
        )}
      </button>
    </div>
  );
}
