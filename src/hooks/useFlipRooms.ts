"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FlipRoomState, FlipTier } from "@/types";

export function useFlipRooms(tier: FlipTier | null) {
  const [rooms, setRooms] = useState<FlipRoomState[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const tierRef = useRef(tier);
  tierRef.current = tier;

  const normalizeRoom = useCallback((room: Record<string, unknown>): FlipRoomState => ({
    ...room,
    tier: Number(room.tierLamports) / 1_000_000_000,
    payoutAmount: room.payoutLamports == null ? null : Number(room.payoutLamports) / 1_000_000_000,
    houseRake: room.houseRakeLamports == null ? null : Number(room.houseRakeLamports) / 1_000_000_000,
  } as FlipRoomState), []);

  const connect = useCallback((t: FlipTier) => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(`/api/flip/stream/${t}`);
    esRef.current = es;

    es.addEventListener("init", (e) => {
      setRooms((JSON.parse(e.data) as Record<string, unknown>[]).map(normalizeRoom));
      setConnected(true);
      retriesRef.current = 0;
    });

    es.addEventListener("room:update", (e) => {
      const room = normalizeRoom(JSON.parse(e.data) as Record<string, unknown>);
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;

      // Reconnect with exponential backoff (1s, 2s, 4s, max 10s)
      const delay = Math.min(1000 * Math.pow(2, retriesRef.current), 10000);
      retriesRef.current++;
      setTimeout(() => {
        if (tierRef.current === t) {
          connect(t);
        }
      }, delay);
    };

    es.onopen = () => {
      setConnected(true);
    };
  }, [normalizeRoom]);

  useEffect(() => {
    if (!tier) {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setRooms([]);
      setConnected(false);
      return;
    }

    retriesRef.current = 0;
    connect(tier);

    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      setConnected(false);
    };
  }, [tier, connect]);

  return { rooms, connected };
}
