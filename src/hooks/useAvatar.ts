"use client";

import { useState, useEffect } from "react";

// Simple event-based avatar store
const cache = new Map<string, string>();
const eventTarget = typeof window !== "undefined" ? new EventTarget() : null;

export function invalidateAvatarCache(wallet?: string) {
  if (wallet) {
    cache.delete(wallet);
  } else {
    cache.clear();
  }
  eventTarget?.dispatchEvent(new CustomEvent("avatar-change", { detail: wallet }));
}

export function useAvatar(wallet: string | null): string {
  const [avatar, setAvatar] = useState<string>(() =>
    wallet ? cache.get(wallet) || "Abase" : "Abase"
  );

  useEffect(() => {
    if (!wallet) return;

    const doFetch = () => {
      fetch(`/api/player/profile?wallet=${wallet}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const av = data?.avatar || "Abase";
          cache.set(wallet, av);
          setAvatar(av);
        })
        .catch(() => {});
    };

    // Serve from cache instantly, then fetch fresh
    if (cache.has(wallet)) {
      setAvatar(cache.get(wallet)!);
    }
    doFetch();

    // Listen for invalidation events
    const handler = (e: Event) => {
      const changed = (e as CustomEvent).detail;
      if (!changed || changed === wallet) {
        doFetch();
      }
    };
    eventTarget?.addEventListener("avatar-change", handler);
    return () => {
      eventTarget?.removeEventListener("avatar-change", handler);
    };
  }, [wallet]);

  return avatar;
}
