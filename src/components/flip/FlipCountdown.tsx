"use client";

import { useState, useEffect, useRef } from "react";
import { useSound } from "@/hooks/useSound";

interface Props {
  active: boolean;
  onComplete?: () => void;
}

export function FlipCountdown({ active, onComplete }: Props) {
  const [count, setCount] = useState(5);
  const { play } = useSound();
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      setCount(5);
      return;
    }

    setCount(5);
    play("flip_tick");

    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          play("flip_go");
          onCompleteRef.current?.();
          return 0;
        }
        play("flip_tick");
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [active, play]);

  if (!active || count === 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-surface/60 backdrop-blur-sm rounded-xl">
      <span
        key={count}
        className="font-display text-[56px] font-black text-on-surface"
        style={{
          animation: "countdownPulse 0.8s ease forwards",
          textShadow: "0 0 30px rgba(52,254,160,0.4)",
        }}
      >
        {count}
      </span>
    </div>
  );
}
