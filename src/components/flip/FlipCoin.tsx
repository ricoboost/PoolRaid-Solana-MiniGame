"use client";

import { useEffect, useRef } from "react";
import { useSound } from "@/hooks/useSound";

interface Props {
  status: "idle" | "flipping" | "result";
  result: "heads" | "tails" | null;
}

const coinShadow = "0 4px 12px rgba(0,0,0,0.6), 0 0 0 3px rgba(192,188,180,0.35), inset 0 2px 3px rgba(255,255,255,0.25), inset 0 -2px 3px rgba(0,0,0,0.15)";

export function FlipCoin({ status, result }: Props) {
  const { play } = useSound();
  const soundPlayedRef = useRef(false);

  // Play sound once when flipping starts
  useEffect(() => {
    if (status === "flipping" && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      play("coin_spin");
    }
    if (status === "idle") {
      soundPlayedRef.current = false;
    }
  }, [status, play]);

  const isSpinning = status === "flipping" && !result;
  const showResult = result !== null && status !== "idle";
  const finalRotation = result === "tails" ? "rotateY(180deg)" : "rotateY(0deg)";

  return (
    <div className="flex items-center justify-center" style={{ perspective: "600px" }}>
      <div
        className="relative w-16 h-16 md:w-20 md:h-20"
        style={{
          transformStyle: "preserve-3d",
          ...(isSpinning
            ? { animation: "coinSpin 0.3s linear infinite" }
            : showResult
            ? { transform: finalRotation, transition: "transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)" }
            : { transform: "rotateY(0deg)" }
          ),
        }}
      >
        <div className="absolute inset-0 rounded-full overflow-hidden" style={{ backfaceVisibility: "hidden", boxShadow: coinShadow }}>
          { }
          <img src="/images/ui/coin_head.webp" alt="Heads" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 rounded-full overflow-hidden" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", boxShadow: coinShadow }}>
          { }
          <img src="/images/ui/coin_tail.webp" alt="Tails" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
