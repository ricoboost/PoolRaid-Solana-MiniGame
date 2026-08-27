"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import React from "react";

const SOUNDS: Record<string, string> = {
  scratch_loop: "/audio/01_scratch_loop.mp3",
  zone_nothing: "/audio/02_zone_reveal_nothing.mp3",
  zone_small: "/audio/03_zone_reveal_small.mp3",
  zone_win: "/audio/04_zone_reveal_win.mp3",
  zone_big: "/audio/05_zone_reveal_big.mp3",
  zone_jackpot: "/audio/06_zone_reveal_jackpot.mp3",
  raid_miss: "/audio/07_raid_miss.mp3",
  raid_hit: "/audio/08_raid_hit.mp3",
  raid_drain: "/audio/09_raid_drain.mp3",
  free_ticket: "/audio/10_free_ticket.mp3",
  free_ticket_up: "/audio/11_free_ticket_up.mp3",
  all_revealed: "/audio/12_all_zones_revealed.mp3",
  win_result: "/audio/13_win_result.mp3",
  payout_sent: "/audio/14_payout_sent.mp3",
  no_win: "/audio/15_no_win.mp3",
  flip_sit: "/audio/16_flip_sit.mp3",
  flip_opponent: "/audio/17_flip_opponent_joins.mp3",
  flip_tick: "/audio/18_flip_countdown_tick.mp3",
  flip_go: "/audio/19_flip_countdown_go.mp3",
  coin_spin: "/audio/20_coin_spinning.mp3",
  flip_win: "/audio/21_flip_win.mp3",
  flip_lose: "/audio/22_flip_lose.mp3",
  flip_leave: "/audio/23_flip_leave.mp3",
  click: "/audio/24_button_click.mp3",
  wallet_connect: "/audio/25_wallet_connect.mp3",
  wallet_disconnect: "/audio/26_wallet_disconnect.mp3",
  error: "/audio/27_error.mp3",
  achievement: "/audio/28_achievement_unlock.mp3",
  level_up: "/audio/29_level_up.mp3",
  streak: "/audio/30_streak_fire.mp3",
  copy: "/audio/31_copy_clipboard.mp3",
  notification: "/audio/32_notification.mp3",
  ambient_scratch: "/audio/33_ambient_scratch.mp3",
  ambient_flip: "/audio/34_ambient_flip.mp3",
};

export type SoundName = keyof typeof SOUNDS;

// Global mutable state — avoids re-renders in game components
const soundState = {
  muted: false,
  volume: 0.5,
};

// Audio cache
const audioCache = new Map<string, HTMLAudioElement>();
const loopingAudio = new Map<string, HTMLAudioElement>();

function getAudio(name: string): HTMLAudioElement | null {
  const src = SOUNDS[name];
  if (!src) return null;
  if (typeof window === "undefined") return null;

  if (!audioCache.has(name)) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audioCache.set(name, audio);
  }
  return audioCache.get(name)!;
}

// Stable functions — never change reference
function play(name: SoundName) {
  if (soundState.muted) return;
  const audio = getAudio(name);
  if (!audio) return;
  audio.volume = soundState.volume;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function playLoop(name: SoundName) {
  if (soundState.muted) return;
  if (loopingAudio.has(name)) return;

  const audio = getAudio(name);
  if (!audio) return;

  const loopAudio = audio.cloneNode(true) as HTMLAudioElement;
  loopAudio.loop = true;
  loopAudio.volume = soundState.volume;
  loopAudio.play().catch(() => {});
  loopingAudio.set(name, loopAudio);
}

function stopLoop(name: SoundName) {
  const audio = loopingAudio.get(name);
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    loopingAudio.delete(name);
  }
}

interface SoundUIValue {
  muted: boolean;
  volume: number;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

// Context only for SoundControl UI (muted/volume state)
const SoundUIContext = createContext<SoundUIValue>({
  muted: false,
  volume: 0.5,
  setMuted: () => {},
  setVolume: () => {},
});

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMutedState] = useState(false);
  const [volume, setVolumeState] = useState(0.5);

  // Load from localStorage
  useEffect(() => {
    const savedMuted = localStorage.getItem("poolraid_sound_muted");
    const savedVolume = localStorage.getItem("poolraid_sound_volume");
    if (savedMuted === "true") { soundState.muted = true; setMutedState(true); }
    if (savedVolume) { const v = parseFloat(savedVolume); if (!isNaN(v)) { soundState.volume = v; setVolumeState(v); } }
  }, []);

  const setMuted = useCallback((m: boolean) => {
    soundState.muted = m;
    setMutedState(m);
    localStorage.setItem("poolraid_sound_muted", String(m));
    for (const audio of loopingAudio.values()) audio.muted = m;
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    soundState.volume = clamped;
    setVolumeState(clamped);
    localStorage.setItem("poolraid_sound_volume", String(clamped));
    for (const audio of loopingAudio.values()) audio.volume = clamped;
  }, []);

  return React.createElement(
    SoundUIContext.Provider,
    { value: { muted, volume, setMuted, setVolume } },
    children
  );
}

/**
 * For game components — returns stable play/playLoop/stopLoop functions.
 * Does NOT cause re-renders when muted/volume changes.
 */
export function useSound() {
  return { play, playLoop, stopLoop };
}

/**
 * For SoundControl UI only — returns muted/volume state that triggers re-renders.
 */
export function useSoundUI() {
  return useContext(SoundUIContext);
}
