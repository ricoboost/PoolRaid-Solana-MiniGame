import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { prisma } from "@/lib/prisma";
import { getPoolWalletSecret, getSolanaCommitment, getSolanaRpcUrl } from "@/lib/env";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
export const connection = new Connection(getSolanaRpcUrl(), getSolanaCommitment());

let poolKeypair: Keypair | null = null;

export function getPoolKeypair(): Keypair {
  if (!poolKeypair) {
    const encoded = getPoolWalletSecret();
    const bytes = encoded.startsWith("[")
      ? Uint8Array.from(JSON.parse(encoded) as number[])
      : bs58.decode(encoded);
    poolKeypair = Keypair.fromSecretKey(bytes);
  }
  return poolKeypair;
}

export function getPoolAddress(): PublicKey {
  return getPoolKeypair().publicKey;
}

export async function getPoolBalanceLamports(): Promise<bigint> {
  return BigInt(await connection.getBalance(getPoolAddress(), getSolanaCommitment()));
}

export function createDepositMemoInstruction(memo: string): TransactionInstruction {
  return new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, "utf8"),
  });
}

export interface VerifiedDeposit {
  signature: string;
  wallet: string;
  recipient: string;
  amountLamports: bigint;
  memo: string;
}

interface PendingPayoutAttempt {
  signature: string;
  signedTransaction: string;
  blockhash: string;
  lastValidBlockHeight: bigint | number;
}

export async function verifyDeposit(input: VerifiedDeposit): Promise<boolean> {
  const tx = await connection.getParsedTransaction(input.signature, {
    commitment: getSolanaCommitment(),
    maxSupportedTransactionVersion: 0,
  });
  if (!tx || tx.meta?.err) return false;

  let transferMatched = false;
  let memoMatched = false;
  for (const instruction of tx.transaction.message.instructions) {
    if ("parsed" in instruction && instruction.program === "system") {
      const parsed = instruction.parsed as { type?: string; info?: Record<string, unknown> };
      if (
        parsed.type === "transfer" &&
        parsed.info?.source === input.wallet &&
        parsed.info?.destination === input.recipient &&
        BigInt(String(parsed.info?.lamports)) === input.amountLamports
      ) {
        transferMatched = true;
      }
    }
    if (instruction.programId.equals(MEMO_PROGRAM_ID) && "parsed" in instruction) {
      const parsed = instruction.parsed as unknown;
      const memo = typeof parsed === "string"
        ? parsed
        : typeof parsed === "object" && parsed && "info" in parsed
          ? String((parsed as { info: unknown }).info)
          : "";
      if (memo === input.memo) memoMatched = true;
    }
  }
  return transferMatched && memoMatched;
}

async function prepareAttempt(payoutId: string, recipient: string, amountLamports: bigint) {
  const keypair = getPoolKeypair();
  const latest = await connection.getLatestBlockhash(getSolanaCommitment());
  const transaction = new Transaction({
    feePayer: keypair.publicKey,
    recentBlockhash: latest.blockhash,
  }).add(SystemProgram.transfer({
    fromPubkey: keypair.publicKey,
    toPubkey: new PublicKey(recipient),
    lamports: amountLamports,
  }));
  transaction.sign(keypair);
  const signatureBytes = transaction.signatures[0]?.signature;
  if (!signatureBytes) throw new Error("Unable to sign payout");
  const signature = bs58.encode(signatureBytes);
  const signedTransaction = transaction.serialize().toString("base64");

  await prisma.$transaction([
    prisma.payoutAttempt.create({
      data: {
        payoutId,
        signature,
        signedTransaction,
        blockhash: latest.blockhash,
        lastValidBlockHeight: BigInt(latest.lastValidBlockHeight),
      },
    }),
    prisma.payout.update({
      where: { id: payoutId },
      data: { status: "signed", signature, lastError: null },
    }),
  ]);
  return { signature, signedTransaction, ...latest };
}

async function submitAttempt(payoutId: string, attempt: {
  signature: string;
  signedTransaction: string;
  blockhash: string;
  lastValidBlockHeight: bigint | number;
}) {
  const raw = Buffer.from(attempt.signedTransaction, "base64");
  await connection.sendRawTransaction(raw, { maxRetries: 3, skipPreflight: false });
  await prisma.$transaction([
    prisma.payoutAttempt.update({ where: { signature: attempt.signature }, data: { status: "submitted" } }),
    prisma.payout.update({ where: { id: payoutId }, data: { status: "submitted" } }),
  ]);

  try {
    const confirmation = await connection.confirmTransaction({
      signature: attempt.signature,
      blockhash: attempt.blockhash,
      lastValidBlockHeight: Number(attempt.lastValidBlockHeight),
    }, getSolanaCommitment());
    if (confirmation.value.err) throw new Error(`Payout transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    await prisma.$transaction([
      prisma.payoutAttempt.update({ where: { signature: attempt.signature }, data: { status: "confirmed" } }),
      prisma.payout.update({ where: { id: payoutId }, data: { status: "confirmed", lastError: null } }),
    ]);
    return "confirmed";
  } catch (error) {
    const status = await connection.getSignatureStatus(attempt.signature, { searchTransactionHistory: true });
    if (status.value && !status.value.err && ["confirmed", "finalized"].includes(status.value.confirmationStatus || "")) {
      await prisma.$transaction([
        prisma.payoutAttempt.update({ where: { signature: attempt.signature }, data: { status: "confirmed" } }),
        prisma.payout.update({ where: { id: payoutId }, data: { status: "confirmed", lastError: null } }),
      ]);
      return "confirmed";
    }
    const message = error instanceof Error ? error.message : "Confirmation pending";
    await prisma.payout.update({ where: { id: payoutId }, data: { lastError: message.slice(0, 500) } });
    return "submitted";
  }
}

export async function ensurePayout(input: {
  businessKey: string;
  kind: string;
  recipientWallet: string;
  amountLamports: bigint;
}) {
  if (input.amountLamports <= 0n) throw new Error("Payout amount must be positive");
  const payout = await prisma.payout.upsert({
    where: { businessKey: input.businessKey },
    update: {},
    create: input,
  });
  if (payout.recipientWallet !== input.recipientWallet || payout.amountLamports !== input.amountLamports) {
    throw new Error("Payout idempotency conflict");
  }
  if (payout.status === "confirmed") return payout;

  let attempt: PendingPayoutAttempt | null = await prisma.payoutAttempt.findFirst({
    where: { payoutId: payout.id, status: { in: ["signed", "submitted"] } },
    orderBy: { createdAt: "desc" },
  });
  if (attempt) {
    const signatureStatus = await connection.getSignatureStatus(attempt.signature, { searchTransactionHistory: true });
    if (signatureStatus.value && !signatureStatus.value.err && ["confirmed", "finalized"].includes(signatureStatus.value.confirmationStatus || "")) {
      await prisma.$transaction([
        prisma.payoutAttempt.update({ where: { signature: attempt.signature }, data: { status: "confirmed" } }),
        prisma.payout.update({ where: { id: payout.id }, data: { status: "confirmed", signature: attempt.signature, lastError: null } }),
      ]);
      return prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    }
    const height = await connection.getBlockHeight(getSolanaCommitment());
    if (height > Number(attempt.lastValidBlockHeight)) {
      await prisma.$transaction([
        prisma.payoutAttempt.update({ where: { signature: attempt.signature }, data: { status: "expired" } }),
        prisma.payout.update({ where: { id: payout.id }, data: { status: "pending", signature: null } }),
      ]);
      attempt = null;
    }
  }

  if (!attempt) {
    const claimed = await prisma.payout.updateMany({
      where: { id: payout.id, status: "pending" },
      data: { status: "preparing", lastError: null },
    });
    if (claimed.count !== 1) return prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
    try {
      attempt = await prepareAttempt(payout.id, payout.recipientWallet, payout.amountLamports);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payout preparation failed";
      await prisma.payout.update({
        where: { id: payout.id },
        data: { status: "pending", lastError: message.slice(0, 500) },
      });
      throw error;
    }
  }

  if (!attempt) return prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
  const prepared = attempt;
  try {
    await submitAttempt(payout.id, prepared);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payout submission failed";
    await prisma.$transaction([
      prisma.payoutAttempt.update({ where: { signature: prepared.signature }, data: { error: message.slice(0, 500) } }),
      prisma.payout.update({ where: { id: payout.id }, data: { lastError: message.slice(0, 500) } }),
    ]);
  }
  return prisma.payout.findUniqueOrThrow({ where: { id: payout.id } });
}

export async function retryPendingPayouts(limit = 25) {
  await prisma.payout.updateMany({
    where: { status: "preparing", updatedAt: { lt: new Date(Date.now() - 2 * 60_000) } },
    data: { status: "pending", lastError: "Recovered interrupted payout preparation" },
  });
  const pending = await prisma.payout.findMany({
    where: { status: { in: ["pending", "signed", "submitted", "preparing"] } },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });
  for (const payout of pending) {
    await ensurePayout({
      businessKey: payout.businessKey,
      kind: payout.kind,
      recipientWallet: payout.recipientWallet,
      amountLamports: payout.amountLamports,
    });
  }
  return pending.length;
}
