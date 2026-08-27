import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ensurePayout, retryPendingPayouts } from "@/lib/solana";
import { generateFlipSeed, computeFlipResult } from "@/lib/flip/flipFairness";
import { FLIP_HOUSE_CUT_BPS, FLIP_LEAVE_FEE_BPS, flipTierToLamports } from "@/lib/flip/flipTiers";
import { broadcastToTier } from "@/lib/flip/flipBroadcast";
import { serializable } from "@/lib/db";
import { applyBps } from "@/lib/money";
import type { FlipTier } from "@/types";
import { checkMaxPayout } from "@/lib/security";

type RoomRecord = Awaited<ReturnType<typeof prisma.flipRoom.findUniqueOrThrow>>;

export function serializeRoom(room: RoomRecord) {
  const revealed = room.status === "completed";
  return {
    id: room.id,
    roomSlot: room.roomSlot,
    tierLamports: room.tierLamports.toString(),
    status: room.status,
    playerAWallet: room.playerAWallet,
    playerASide: room.playerASide,
    playerBWallet: room.playerBWallet,
    playerBSide: room.playerBSide,
    serverSeedHash: room.serverSeedHash,
    serverSeed: revealed ? room.serverSeed : null,
    result: revealed ? room.result : null,
    winnerWallet: revealed ? room.winnerWallet : null,
    payoutLamports: revealed ? room.payoutLamports?.toString() ?? null : null,
    payoutTx: revealed ? room.payoutTx : null,
    payoutStatus: revealed ? room.payoutStatus : null,
    houseRakeLamports: revealed ? room.houseRakeLamports?.toString() ?? null : null,
    playerASeatedAt: room.playerASeatedAt?.toISOString() ?? null,
    playerBSeatedAt: room.playerBSeatedAt?.toISOString() ?? null,
  };
}

function broadcast(room: RoomRecord) {
  broadcastToTier(room.tierLamports.toString(), "room:update", serializeRoom(room));
}

export async function getRoomsForTier(tier: FlipTier) {
  const rooms = await prisma.flipRoom.findMany({
    where: { tierLamports: flipTierToLamports(tier) },
    orderBy: { roomSlot: "asc" },
  });
  return rooms.map(serializeRoom);
}

export async function reserveRoom(roomId: string, wallet: string, side: "heads" | "tails") {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 2 * 60_000);
  return serializable(async (tx) => {
    const room = await tx.flipRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new Error("Room not found");
    const maximumWinnerPayout = applyBps(room.tierLamports * 2n, 10_000 - FLIP_HOUSE_CUT_BPS);
    if (!checkMaxPayout(maximumWinnerPayout)) throw new Error("Tier exceeds the configured payout maximum");
    if (room.playerAWallet === wallet) throw new Error("Cannot play against yourself");
    const seat = room.status === "empty" ? "A" : room.status === "waiting" && !room.playerBWallet ? "B" : null;
    if (!seat) throw new Error("Room is not available");
    const actualSide = seat === "A" ? side : room.playerASide === "heads" ? "tails" : "heads";
    const reservation = await tx.flipReservation.create({
      data: {
        id,
        roomId,
        wallet,
        side: actualSide,
        seat,
        amountLamports: room.tierLamports,
        memo: `poolraid:flip:${id}`,
        expiresAt,
      },
    });
    await tx.flipRoom.update({
      where: { id: room.id },
      data: { status: seat === "A" ? "reserving" : "matching", activeReservationId: reservation.id },
    });
    return reservation;
  });
}

export async function confirmReservation(reservationId: string, signature: string, wallet: string, recipient: string) {
  const result = await serializable(async (tx) => {
    const reservation = await tx.flipReservation.findUnique({ where: { id: reservationId } });
    if (!reservation || reservation.wallet !== wallet) throw new Error("Reservation not found");
    if (reservation.status !== "pending") throw new Error("Reservation already handled");
    if (reservation.expiresAt <= new Date()) throw new Error("Reservation expired");
    const room = await tx.flipRoom.findUnique({ where: { id: reservation.roomId } });
    if (!room || room.activeReservationId !== reservation.id) throw new Error("Reservation is no longer active");

    await tx.deposit.create({
      data: {
        signature,
        wallet,
        recipient,
        amountLamports: reservation.amountLamports,
        memo: reservation.memo,
        purpose: "flip",
        referenceId: reservation.id,
      },
    });
    await tx.flipReservation.update({
      where: { id: reservation.id },
      data: { status: "confirmed", txSignature: signature, confirmedAt: new Date() },
    });
    if (reservation.seat === "A") {
      const fairness = generateFlipSeed();
      const updated = await tx.flipRoom.update({
        where: { id: room.id },
        data: {
          status: "waiting",
          activeReservationId: null,
          playerAWallet: wallet,
          playerASide: reservation.side,
          playerATx: signature,
          playerASeatedAt: new Date(),
          serverSeed: fairness.serverSeed,
          serverSeedHash: fairness.serverSeedHash,
        },
      });
      return { room: updated, matched: false };
    }
    if (!room.playerAWallet || !room.serverSeed || !room.playerASide) throw new Error("Room is incomplete");
    const flipResult = computeFlipResult(room.serverSeed, room.playerAWallet, wallet, room.id);
    const updated = await tx.flipRoom.update({
      where: { id: room.id },
      data: {
        status: "matched",
        activeReservationId: null,
        playerBWallet: wallet,
        playerBSide: reservation.side,
        playerBTx: signature,
        playerBSeatedAt: new Date(),
        result: flipResult,
        winnerWallet: flipResult === room.playerASide ? room.playerAWallet : wallet,
      },
    });
    return { room: updated, matched: true };
  });
  broadcast(result.room);
  if (result.matched) scheduleFlipSequence(result.room.id, result.room.tierLamports);
  return serializeRoom(result.room);
}

export async function refundInvalidReservation(reservationId: string, signature: string, wallet: string, recipient: string) {
  const reservation = await prisma.flipReservation.findUnique({ where: { id: reservationId } });
  if (!reservation || reservation.wallet !== wallet) throw new Error("Reservation not found");
  await prisma.$transaction([
    prisma.deposit.create({
      data: {
        signature,
        wallet,
        recipient,
        amountLamports: reservation.amountLamports,
        memo: reservation.memo,
        purpose: "flip_refund",
        referenceId: reservation.id,
      },
    }),
    prisma.flipReservation.update({ where: { id: reservation.id }, data: { status: "refunding", txSignature: signature } }),
  ]);
  const payout = await ensurePayout({
    businessKey: `flip-reservation-refund:${reservation.id}`,
    kind: "flip_reservation_refund",
    recipientWallet: wallet,
    amountLamports: reservation.amountLamports,
  });
  await prisma.flipReservation.update({
    where: { id: reservation.id },
    data: { status: payout.status === "confirmed" ? "refunded" : "refunding" },
  });
  return payout;
}

export async function leaveRoom(roomId: string, wallet: string) {
  const prepared = await serializable(async (tx) => {
    const room = await tx.flipRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new Error("Room not found");
    if (room.status !== "waiting" || room.playerAWallet !== wallet || !room.playerASeatedAt) {
      throw new Error("Can only leave your own waiting room");
    }
    const freeLeave = Date.now() - room.playerASeatedAt.getTime() >= 60_000;
    const fee = freeLeave ? 0n : applyBps(room.tierLamports, FLIP_LEAVE_FEE_BPS);
    const refund = room.tierLamports - fee;
    await tx.flipRoom.update({ where: { id: room.id }, data: { status: "refunding" } });
    if (fee > 0n) {
      await tx.houseProfit.updateMany({ data: { totalProfitLamports: { increment: fee } } });
    }
    return { room, refund };
  });
  const payout = await ensurePayout({
    businessKey: `flip-leave:${prepared.room.id}:${prepared.room.playerATx}`,
    kind: "flip_leave",
    recipientWallet: wallet,
    amountLamports: prepared.refund,
  });
  const reset = await resetRoom(prepared.room.id);
  return { room: serializeRoom(reset), payoutStatus: payout.status, payoutTx: payout.signature };
}

export function scheduleFlipSequence(roomId: string, tierLamports: bigint) {
  setTimeout(async () => {
    try {
      const room = await prisma.flipRoom.updateMany({
        where: { id: roomId, status: "matched" },
        data: { status: "flipping" },
      });
      if (room.count !== 1) return;
      broadcast(await prisma.flipRoom.findUniqueOrThrow({ where: { id: roomId } }));
      setTimeout(() => completeFlip(roomId, tierLamports), 3000);
    } catch (error) {
      console.error("Flip transition failed:", error);
    }
  }, 5000);
}

async function completeFlip(roomId: string, tierLamports: bigint) {
  const room = await prisma.flipRoom.findUnique({ where: { id: roomId } });
  if (!room?.winnerWallet || !room.result || !room.playerAWallet || !room.playerBWallet || !room.serverSeed || !room.serverSeedHash) return;
  const potLamports = tierLamports * 2n;
  const houseRakeLamports = applyBps(potLamports, FLIP_HOUSE_CUT_BPS);
  const payoutLamports = potLamports - houseRakeLamports;
  const completed = await serializable(async (tx) => {
    const fresh = await tx.flipRoom.findUnique({ where: { id: roomId } });
    if (!fresh || !["matched", "flipping", "completed"].includes(fresh.status)) throw new Error("Room not completable");
    const updated = await tx.flipRoom.update({
      where: { id: roomId },
      data: {
        status: "completed",
        payoutLamports,
        houseRakeLamports,
        payoutStatus: "pending",
        completedAt: fresh.completedAt || new Date(),
      },
    });
    const existingHistory = await tx.flipHistory.findUnique({ where: { serverSeedHash: fresh.serverSeedHash! } });
    if (!existingHistory) {
      await tx.flipHistory.create({ data: {
        tierLamports,
        playerAWallet: fresh.playerAWallet!,
        playerBWallet: fresh.playerBWallet!,
        winnerWallet: fresh.winnerWallet!,
        result: fresh.result!,
        potLamports,
        payoutLamports,
        houseRakeLamports,
        payoutStatus: "pending",
        serverSeed: fresh.serverSeed!,
        serverSeedHash: fresh.serverSeedHash!,
      } });
      await tx.houseProfit.updateMany({ data: { totalProfitLamports: { increment: houseRakeLamports } } });
    }
    return updated;
  });
  broadcast(completed);
  const payout = await ensurePayout({
    businessKey: `flip-win:${room.serverSeedHash}`,
    kind: "flip_win",
    recipientWallet: room.winnerWallet,
    amountLamports: payoutLamports,
  });
  const finalRoom = await prisma.flipRoom.update({
    where: { id: roomId },
    data: { payoutTx: payout.signature, payoutStatus: payout.status },
  });
  await prisma.flipHistory.update({
    where: { serverSeedHash: room.serverSeedHash },
    data: { payoutTx: payout.signature, payoutStatus: payout.status },
  });
  broadcast(finalRoom);
  setTimeout(() => resetRoom(roomId).then(broadcast).catch(console.error), 8000);
}

async function resetRoom(roomId: string) {
  return prisma.flipRoom.update({
    where: { id: roomId },
    data: {
      status: "empty",
      activeReservationId: null,
      playerAWallet: null,
      playerASide: null,
      playerATx: null,
      playerASeatedAt: null,
      playerBWallet: null,
      playerBSide: null,
      playerBTx: null,
      playerBSeatedAt: null,
      serverSeed: null,
      serverSeedHash: null,
      result: null,
      winnerWallet: null,
      payoutLamports: null,
      payoutTx: null,
      payoutStatus: null,
      houseRakeLamports: null,
      completedAt: null,
      resetAt: new Date(),
    },
  });
}

export async function cleanupStaleRooms(tier?: FlipTier) {
  const now = new Date();
  const tierFilter = tier == null ? {} : { tierLamports: flipTierToLamports(tier) };
  const expiredReservations = await prisma.flipReservation.findMany({
    where: { status: "pending", expiresAt: { lt: now }, ...(tier == null ? {} : { amountLamports: flipTierToLamports(tier) }) },
  });
  for (const reservation of expiredReservations) {
    await serializable(async (tx) => {
      await tx.flipReservation.updateMany({ where: { id: reservation.id, status: "pending" }, data: { status: "expired" } });
      const room = await tx.flipRoom.findUnique({ where: { id: reservation.roomId } });
      if (room?.activeReservationId === reservation.id) {
        await tx.flipRoom.update({
          where: { id: room.id },
          data: { status: reservation.seat === "A" ? "empty" : "waiting", activeReservationId: null },
        });
      }
    });
  }

  const staleWaiting = await prisma.flipRoom.findMany({
    where: { ...tierFilter, status: "waiting", playerASeatedAt: { lt: new Date(now.getTime() - 30 * 60_000) } },
  });
  for (const room of staleWaiting) {
    if (room.playerAWallet) {
      await ensurePayout({
        businessKey: `flip-expire:${room.id}:${room.playerATx}`,
        kind: "flip_expiry_refund",
        recipientWallet: room.playerAWallet,
        amountLamports: room.tierLamports,
      });
    }
    broadcast(await resetRoom(room.id));
  }

  const stuck = await prisma.flipRoom.findMany({
    where: {
      ...tierFilter,
      status: { in: ["matched", "flipping"] },
      playerBSeatedAt: { lt: new Date(now.getTime() - 5 * 60_000) },
    },
  });
  for (const room of stuck) await completeFlip(room.id, room.tierLamports);
  const payoutsRetried = await retryPendingPayouts();
  return { reservationsExpired: expiredReservations.length, staleRefunded: staleWaiting.length, stuckResolved: stuck.length, payoutsRetried };
}

export async function countActiveSeats(wallet: string): Promise<number> {
  return prisma.flipRoom.count({
    where: {
      OR: [
        { playerAWallet: wallet, status: { in: ["waiting", "matching", "matched", "flipping"] } },
        { playerBWallet: wallet, status: { in: ["matched", "flipping"] } },
      ],
    },
  });
}
