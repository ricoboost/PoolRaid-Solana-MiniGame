"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useConnection } from "@solana/wallet-adapter-react";
import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { FlipSeatCircle } from "./FlipSeatCircle";
import { FlipCoin } from "./FlipCoin";
import { FlipCountdown } from "./FlipCountdown";
import { useAvatar } from "@/hooks/useAvatar";
import { useSound } from "@/hooks/useSound";
import { formatSOL, truncateWallet } from "@/lib/utils";
import type { FlipRoomState } from "@/types";
import { createDepositMemoInstruction } from "@/lib/solana-client";
import { useWalletSession } from "@/hooks/useWalletSession";

interface Props {
  room: FlipRoomState;
}

export function FlipRoomCard({ room }: Props) {
  const { publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const { ensureSession } = useWalletSession();

  const myWallet = publicKey?.toBase58() ?? null;
  const avatarA = useAvatar(room.playerAWallet);
  const avatarB = useAvatar(room.playerBWallet);
  const { play } = useSound();
  const prevStatusRef = useRef(room.status);

  // Sound effects on room status changes
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = room.status;
    if (prev === room.status) return;

    const isMe = myWallet === room.playerAWallet || myWallet === room.playerBWallet;
    if (!isMe) return;

    if (room.status === "matched" && prev === "waiting") play("flip_opponent");
    if (room.status === "completed" && (prev === "flipping" || prev === "matched")) {
      if (room.winnerWallet === myWallet) play("flip_win");
      else play("flip_lose");
    }
  }, [room.status, room.winnerWallet, room.playerAWallet, room.playerBWallet, myWallet, play]);
  const isPlayerA = myWallet === room.playerAWallet;
  const isPlayerB = myWallet === room.playerBWallet;
  const isParticipant = isPlayerA || isPlayerB;

  const getSeatAState = () => {
    if (!room.playerAWallet) return "empty" as const;
    if (room.status === "completed" || room.status === "flipping") {
      return room.winnerWallet === room.playerAWallet ? "winner" : "loser";
    }
    return "occupied" as const;
  };

  const getSeatBState = () => {
    if (!room.playerBWallet) return "empty" as const;
    if (room.status === "completed" || room.status === "flipping") {
      return room.winnerWallet === room.playerBWallet ? "winner" : "loser";
    }
    return "occupied" as const;
  };

  const getCoinStatus = () => {
    if (room.status === "flipping") return "flipping" as const;
    if (room.status === "completed") return "result" as const;
    return "idle" as const;
  };

  const handleSit = useCallback(async (side: "heads" | "tails") => {
    if (!publicKey || !signTransaction) {
      setVisible(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ensureSession();
      const reserveResponse = await fetch("/api/flip/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, side }),
      });
      const reservation = await reserveResponse.json();
      if (!reserveResponse.ok) throw new Error(reservation.error || "Failed to reserve seat");
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(reservation.depositAddress),
          lamports: BigInt(reservation.amountLamports),
        }),
        createDepositMemoInstruction(reservation.memo),
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      const signed = await signTransaction!(transaction);
      const rawTx = signed.serialize();
      const signature = await connection.sendRawTransaction(rawTx);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "finalized");

      const res = await fetch("/api/flip/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: reservation.reservationId,
          txSignature: signature,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to sit");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to sit";
      if (msg.includes("User rejected") || msg.includes("rejected the request")) {
        setError("Transaction rejected — you are not seated.");
      } else if (msg.includes("insufficient funds") || msg.includes("Insufficient") || msg.includes("0x1")) {
        setError("Insufficient SOL balance in your wallet.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey, signTransaction, connection, room.id, setVisible, ensureSession]);

  const handleLeave = useCallback(async () => {
    if (!myWallet) return;

    setLoading(true);
    setError(null);

    try {
      await ensureSession();
      const res = await fetch("/api/flip/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to leave");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave");
    } finally {
      setLoading(false);
    }
  }, [myWallet, room.id, ensureSession]);

  const isCountdown = room.status === "matched";

  // Leave countdown — free leave after 60s
  const [leaveSeconds, setLeaveSeconds] = useState<number | null>(null);
  useEffect(() => {
    if (room.status === "waiting" && isPlayerA && room.playerASeatedAt) {
      const seatedAt = new Date(room.playerASeatedAt).getTime();
      const update = () => {
        const elapsed = Math.floor((Date.now() - seatedAt) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        setLeaveSeconds(remaining);
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    } else {
      setLeaveSeconds(null);
    }
  }, [room.status, isPlayerA, room.playerASeatedAt]);

  // Determine sides to display
  const seatASide = room.playerASide || "heads";
  const seatBSide = room.playerBSide || (seatASide === "heads" ? "tails" : "heads");

  return (
    <div
      className={`relative rounded-xl p-3 md:p-4 transition-all ${
        room.status === "completed" && isParticipant && room.winnerWallet === myWallet
          ? "bg-primary/[0.06] border border-primary/20"
          : room.status === "completed" && isParticipant
          ? "bg-lose/[0.04] border border-lose/10"
          : "bg-surface-container border border-surface-bright/20"
      }`}
      style={{
        boxShadow:
          room.status === "completed" && room.winnerWallet === myWallet
            ? "0 0 30px rgba(52,254,160,0.1)"
            : "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      {/* Room number */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[9px] text-text-ghost uppercase tracking-wider">
          Room #{room.roomSlot}
        </span>
        <span className={`font-mono text-[9px] uppercase tracking-wider ${
          room.status === "empty" ? "text-text-ghost" :
          room.status === "waiting" ? "text-tertiary" :
          room.status === "matched" || room.status === "flipping" ? "text-primary" :
          "text-on-surface-variant"
        }`}>
          {room.status === "empty" ? "Open" :
           room.status === "waiting" ? "Waiting..." :
           room.status === "matched" ? "Matched!" :
           room.status === "flipping" ? "Flipping..." :
           room.status === "completed" ? "Complete" : room.status}
        </span>
      </div>

      {/* Seats + Coin layout */}
      <div className="flex items-center justify-center gap-4 md:justify-between md:gap-2">
        {/* Left seat = Heads (or P1's chosen side) */}
        <FlipSeatCircle
          state={getSeatAState()}
          wallet={room.playerAWallet}
          avatar={avatarA}
          side={seatASide}
          isCurrentUser={isPlayerA}
          onSit={
            room.status === "empty" && !loading
              ? () => handleSit("heads")
              : room.status === "waiting" && !isPlayerA && !loading
              ? () => handleSit("heads")
              : undefined
          }
        />

        <FlipCoin
          status={getCoinStatus()}
          result={room.result}
        />

        {/* Right seat = Tails (or opposite of P1's chosen side) */}
        <FlipSeatCircle
          state={getSeatBState()}
          wallet={room.playerBWallet}
          avatar={avatarB}
          side={seatBSide}
          isCurrentUser={isPlayerB}
          onSit={
            room.status === "empty" && !loading
              ? () => handleSit("tails")
              : room.status === "waiting" && !isPlayerA && !loading
              ? () => handleSit("tails")
              : undefined
          }
        />
      </div>

      {/* Countdown overlay */}
      <FlipCountdown active={isCountdown} />

      {/* Action area */}
      <div className="mt-3 min-h-[28px]">
        {/* Leave button for P1 waiting */}
        {room.status === "waiting" && isPlayerA && leaveSeconds !== null && (
          <button
            onClick={handleLeave}
            disabled={loading}
            className={`w-full py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
              leaveSeconds === 0
                ? "text-primary bg-primary/[0.08] hover:bg-primary/[0.14]"
                : "text-text-muted bg-surface-lowest hover:text-on-surface-variant"
            }`}
          >
            {loading ? "Leaving..." : leaveSeconds === 0 ? "Leave Room (free)" : `Leave (${leaveSeconds}s)`}
          </button>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-[10px] text-text-muted">Processing...</span>
          </div>
        )}

        {/* Result info */}
        {room.status === "completed" && room.winnerWallet && (
          <div className="text-center">
            <p className={`font-display text-[13px] font-bold ${
              room.winnerWallet === myWallet ? "text-primary" : "text-on-surface-variant"
            }`}>
              {room.winnerWallet === myWallet ? "You Won!" : `${truncateWallet(room.winnerWallet)} Won`}
            </p>
            {room.payoutAmount != null && (
              <p className="font-mono text-[11px] text-primary font-semibold">
                +{formatSOL(room.payoutAmount)} SOL
              </p>
            )}
            {room.serverSeedHash && (
              <button
                onClick={() => setShowVerify(!showVerify)}
                className="font-mono text-[8px] text-text-ghost hover:text-primary transition-colors mt-1 cursor-pointer"
              >
                {showVerify ? "Hide" : "Verify"} &middot; {room.serverSeedHash.slice(0, 12)}...
              </button>
            )}
          </div>
        )}

        {/* Verify details */}
        {showVerify && room.status === "completed" && room.serverSeed && (
          <div className="mt-2 p-2 rounded-lg bg-surface-lowest text-left space-y-1">
            <div>
              <span className="font-mono text-[8px] text-text-ghost">Seed Hash: </span>
              <span className="font-mono text-[8px] text-on-surface-variant break-all">{room.serverSeedHash}</span>
            </div>
            <div>
              <span className="font-mono text-[8px] text-text-ghost">Seed: </span>
              <span className="font-mono text-[8px] text-on-surface-variant break-all">{room.serverSeed}</span>
            </div>
            <div>
              <span className="font-mono text-[8px] text-text-ghost">Result: </span>
              <span className="font-mono text-[8px] text-primary font-bold">{room.result}</span>
            </div>
            {room.payoutTx && (
              <a
                href={`https://explorer.solana.com/tx/${room.payoutTx}${process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"}`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[8px] text-primary hover:text-primary/80 underline"
              >
                View on Solana Explorer
              </a>
            )}
          </div>
        )}

        {/* Bet amount display for empty rooms */}
        {room.status === "empty" && !loading && (
          <p className="text-center font-mono text-[10px] text-text-ghost">
            {formatSOL(room.tier)} SOL &middot; Pick a side
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 font-mono text-[10px] text-lose text-center">{error}</p>
      )}
    </div>
  );
}
