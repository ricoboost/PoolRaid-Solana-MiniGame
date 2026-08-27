"use client";

import { useMemo } from "react";

interface WinParticlesProps {
  count?: number;
  color?: "green" | "gold" | "purple";
}

const COLORS = {
  green: "#34fea0",
  gold: "#ffe792",
  purple: "#b984ff",
};

export function WinParticles({ count = 24, color = "green" }: WinParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const distance = 60 + Math.random() * 80;
      return {
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        delay: Math.random() * 0.3,
        size: 3 + Math.random() * 4,
        id: i,
      };
    });
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: COLORS[color],
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            animation: `pop 0.7s ${p.delay}s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
            opacity: 0,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
