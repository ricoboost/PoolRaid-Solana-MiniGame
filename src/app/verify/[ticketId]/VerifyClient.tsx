"use client";

import { useState } from "react";

interface VerifyClientProps {
  seed: string;
  seedHash: string;
}

export function VerifyClient({ seed, seedHash }: VerifyClientProps) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [computing, setComputing] = useState(false);

  async function verify() {
    setComputing(true);
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(seed);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computed = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setVerified(computed === seedHash);
    } catch {
      setVerified(false);
    } finally {
      setComputing(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={verify}
        disabled={computing}
        className="px-4 py-2 rounded-[--radius-sm] border border-[--border-medium] font-display text-[11px] font-bold uppercase tracking-[0.1em] text-gold-primary hover:bg-bg-hover transition-all duration-200 cursor-pointer disabled:opacity-50"
      >
        {computing ? "Computing..." : "Verify SHA-256"}
      </button>
      {verified === true && (
        <p className="mt-2 font-mono text-[11px] font-bold text-win">
          Verified — SHA-256(seed) matches seedHash
        </p>
      )}
      {verified === false && (
        <p className="mt-2 font-mono text-[11px] font-bold text-lose">
          Verification failed — hashes do not match
        </p>
      )}
    </div>
  );
}
