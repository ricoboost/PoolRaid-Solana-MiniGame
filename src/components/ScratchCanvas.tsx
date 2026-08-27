"use client";

import { useRef, useEffect, useState } from "react";

interface ScratchCanvasProps {
  width: number;
  height: number;
  onReveal: () => void;
  revealThreshold?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

export function ScratchCanvas({
  width,
  height,
  onReveal,
  revealThreshold = 0.25,
  disabled = false,
  children,
}: ScratchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasRevealed = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [coated, setCoated] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const checkCounter = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas is 8px larger than container (4px overflow each side)
    // Container clips it with overflow:hidden — guarantees zero edge/corner gaps
    const PAD = 4;
    const cw = width + PAD * 2;
    const ch = height + PAD * 2;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.scale(dpr, dpr);

    // Dark opaque coating
    const gradient = ctx.createLinearGradient(0, 0, cw, ch);
    gradient.addColorStop(0, "#1a1f2e");
    gradient.addColorStop(0.5, "#222838");
    gradient.addColorStop(1, "#1a1f2e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cw, ch);

    // Subtle dot pattern
    ctx.fillStyle = "rgba(52, 254, 160, 0.03)";
    for (let x = 0; x < cw; x += 12) {
      for (let y = 0; y < ch; y += 12) {
        ctx.beginPath();
        ctx.arc(x + 6, y + 6, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // "SCRATCH HERE" text — centered on the visible area (offset by PAD)
    ctx.save();
    ctx.fillStyle = "rgba(52, 254, 160, 0.10)";
    ctx.font = `bold ${Math.min(width, height) * 0.13}px 'Outfit', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCRATCH", cw / 2, ch / 2 - 8);
    ctx.font = `600 ${Math.min(width, height) * 0.07}px 'IBM Plex Mono', monospace`;
    ctx.fillStyle = "rgba(52, 254, 160, 0.06)";
    ctx.fillText("HERE", cw / 2, ch / 2 + 14);
    ctx.restore();

    hasRevealed.current = false;
    setRevealed(false);
    setCoated(true);
    checkCounter.current = 0;
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;

    const dpr = window.devicePixelRatio || 1;
    const PAD = 4;
    const cw = width + PAD * 2;
    const ch = height + PAD * 2;

    function getPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
      const rect = canvas!.getBoundingClientRect();
      const scaleX = cw / rect.width;
      const scaleY = ch / rect.height;
      if ("touches" in e && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        };
      }
      const me = e as MouseEvent;
      return {
        x: (me.clientX - rect.left) * scaleX,
        y: (me.clientY - rect.top) * scaleY,
      };
    }

    function scratch(x: number, y: number) {
      if (hasRevealed.current) return;
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;

      ctx.globalCompositeOperation = "destination-out";

      const prev = lastPoint.current;
      if (prev) {
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.lineWidth = 30;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();

      lastPoint.current = { x, y };

      checkCounter.current++;
      if (checkCounter.current % 5 !== 0) return;

      const imageData = ctx.getImageData(0, 0, canvas!.width, canvas!.height);
      const pixels = imageData.data;
      let transparent = 0;
      const step = Math.max(1, Math.floor(dpr)) * 4;
      for (let i = 3; i < pixels.length; i += step) {
        if (pixels[i] === 0) transparent++;
      }
      const sampled = Math.ceil(pixels.length / 4 / (step / 4));
      const pct = transparent / sampled;

      if (pct >= revealThreshold) {
        hasRevealed.current = true;
        setRevealed(true);
        ctx.clearRect(0, 0, canvas!.width, canvas!.height);
        onRevealRef.current();
      }
    }

    function onStart(e: MouseEvent | TouchEvent) {
      if (hasRevealed.current) return;
      e.preventDefault();
      isDrawing.current = true;
      const pos = getPos(e);
      lastPoint.current = pos;
      scratch(pos.x, pos.y);
    }

    function onMove(e: MouseEvent | TouchEvent) {
      if (!isDrawing.current || hasRevealed.current) return;
      e.preventDefault();
      const pos = getPos(e);
      scratch(pos.x, pos.y);
    }

    function onEnd() {
      isDrawing.current = false;
      lastPoint.current = null;
    }

    canvas.addEventListener("mousedown", onStart);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onEnd);
    canvas.addEventListener("mouseleave", onEnd);
    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onEnd);

    return () => {
      canvas.removeEventListener("mousedown", onStart);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onEnd);
      canvas.removeEventListener("mouseleave", onEnd);
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [width, height, disabled, revealThreshold]);

  return (
    <div className="relative overflow-hidden" style={{ width, height, borderRadius: 12 }}>
      <div className="absolute inset-0 flex items-center justify-center" style={{ visibility: coated || revealed ? "visible" : "hidden" }}>
        {children}
      </div>
      {!revealed && (
        <canvas
          ref={canvasRef}
          className="absolute cursor-pointer touch-none"
          style={{ top: -4, left: -4, width: width + 8, height: height + 8 }}
        />
      )}
    </div>
  );
}
