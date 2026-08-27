-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "priceLamports" BIGINT NOT NULL,
    "playerWallet" TEXT NOT NULL,
    "depositTx" TEXT,
    "depositMemo" TEXT,
    "depositExpiresAt" TIMESTAMP(3),
    "referralCode" TEXT,
    "seedHash" TEXT NOT NULL,
    "seed" TEXT,
    "zone1Result" JSONB,
    "zone2Result" JSONB,
    "zone3Result" JSONB,
    "totalPayoutLamports" BIGINT NOT NULL DEFAULT 0,
    "payoutTx" TEXT,
    "payoutStatus" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isFreeTicket" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scratchedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "balanceLamports" BIGINT NOT NULL DEFAULT 0,
    "totalInLamports" BIGINT NOT NULL DEFAULT 0,
    "totalOutLamports" BIGINT NOT NULL DEFAULT 0,
    "ticketCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameConfig" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "ticketPriceLamports" BIGINT NOT NULL,
    "houseCutBps" INTEGER NOT NULL DEFAULT 1000,
    "bootstrapCount" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseProfit" (
    "id" TEXT NOT NULL,
    "totalProfitLamports" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseProfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProfile" (
    "wallet" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerProfile_pkey" PRIMARY KEY ("wallet")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerWallet" TEXT NOT NULL,
    "referredWallet" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "bonusPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfExclusion" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "excludeUntil" TIMESTAMP(3) NOT NULL,
    "isPermanent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelfExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDeclaration" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "ipCountry" TEXT NOT NULL,
    "declaredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiveawayLog" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiveawayLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthNonce" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthNonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deposit" (
    "signature" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "amountLamports" BIGINT NOT NULL,
    "memo" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("signature")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "businessKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "recipientWallet" TEXT NOT NULL,
    "amountLamports" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signature" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutAttempt" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "signedTransaction" TEXT NOT NULL,
    "blockhash" TEXT NOT NULL,
    "lastValidBlockHeight" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'signed',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlipReservation" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "wallet" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "seat" TEXT NOT NULL,
    "amountLamports" BIGINT NOT NULL,
    "memo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "txSignature" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "FlipReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlipRoom" (
    "id" TEXT NOT NULL,
    "roomSlot" INTEGER NOT NULL,
    "tierLamports" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'empty',
    "activeReservationId" TEXT,
    "playerAWallet" TEXT,
    "playerASide" TEXT,
    "playerATx" TEXT,
    "playerASeatedAt" TIMESTAMP(3),
    "playerBWallet" TEXT,
    "playerBSide" TEXT,
    "playerBTx" TEXT,
    "playerBSeatedAt" TIMESTAMP(3),
    "serverSeedHash" TEXT,
    "serverSeed" TEXT,
    "result" TEXT,
    "winnerWallet" TEXT,
    "payoutLamports" BIGINT,
    "payoutTx" TEXT,
    "payoutStatus" TEXT,
    "houseRakeLamports" BIGINT,
    "completedAt" TIMESTAMP(3),
    "resetAt" TIMESTAMP(3),

    CONSTRAINT "FlipRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlipHistory" (
    "id" TEXT NOT NULL,
    "tierLamports" BIGINT NOT NULL,
    "playerAWallet" TEXT NOT NULL,
    "playerBWallet" TEXT NOT NULL,
    "winnerWallet" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "potLamports" BIGINT NOT NULL,
    "payoutLamports" BIGINT NOT NULL,
    "houseRakeLamports" BIGINT NOT NULL,
    "payoutTx" TEXT,
    "payoutStatus" TEXT,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_depositTx_key" ON "Ticket"("depositTx");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_depositMemo_key" ON "Ticket"("depositMemo");

-- CreateIndex
CREATE INDEX "Ticket_playerWallet_idx" ON "Ticket"("playerWallet");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_tier_idx" ON "Ticket"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "Pool_tier_key" ON "Pool"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "GameConfig_tier_key" ON "GameConfig"("tier");

-- CreateIndex
CREATE INDEX "Achievement_wallet_idx" ON "Achievement"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_wallet_achievementId_key" ON "Achievement"("wallet", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_wallet_key" ON "ReferralCode"("wallet");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredWallet_key" ON "Referral"("referredWallet");

-- CreateIndex
CREATE INDEX "Referral_referrerWallet_idx" ON "Referral"("referrerWallet");

-- CreateIndex
CREATE INDEX "RateLimit_wallet_action_timestamp_idx" ON "RateLimit"("wallet", "action", "timestamp");

-- CreateIndex
CREATE INDEX "SelfExclusion_walletAddress_idx" ON "SelfExclusion"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "UserDeclaration_walletAddress_key" ON "UserDeclaration"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "GiveawayLog_createdAt_idx" ON "GiveawayLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthNonce_nonce_key" ON "AuthNonce"("nonce");

-- CreateIndex
CREATE INDEX "AuthNonce_wallet_purpose_expiresAt_idx" ON "AuthNonce"("wallet", "purpose", "expiresAt");

-- CreateIndex
CREATE INDEX "Deposit_wallet_createdAt_idx" ON "Deposit"("wallet", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_purpose_referenceId_key" ON "Deposit"("purpose", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_businessKey_key" ON "Payout"("businessKey");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_signature_key" ON "Payout"("signature");

-- CreateIndex
CREATE INDEX "Payout_status_updatedAt_idx" ON "Payout"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Payout_recipientWallet_idx" ON "Payout"("recipientWallet");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutAttempt_signature_key" ON "PayoutAttempt"("signature");

-- CreateIndex
CREATE INDEX "PayoutAttempt_payoutId_createdAt_idx" ON "PayoutAttempt"("payoutId", "createdAt");

-- CreateIndex
CREATE INDEX "PayoutAttempt_status_idx" ON "PayoutAttempt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FlipReservation_memo_key" ON "FlipReservation"("memo");

-- CreateIndex
CREATE UNIQUE INDEX "FlipReservation_txSignature_key" ON "FlipReservation"("txSignature");

-- CreateIndex
CREATE INDEX "FlipReservation_roomId_status_idx" ON "FlipReservation"("roomId", "status");

-- CreateIndex
CREATE INDEX "FlipReservation_wallet_status_idx" ON "FlipReservation"("wallet", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FlipRoom_playerATx_key" ON "FlipRoom"("playerATx");

-- CreateIndex
CREATE UNIQUE INDEX "FlipRoom_playerBTx_key" ON "FlipRoom"("playerBTx");

-- CreateIndex
CREATE INDEX "FlipRoom_tierLamports_status_idx" ON "FlipRoom"("tierLamports", "status");

-- CreateIndex
CREATE INDEX "FlipRoom_playerAWallet_idx" ON "FlipRoom"("playerAWallet");

-- CreateIndex
CREATE INDEX "FlipRoom_playerBWallet_idx" ON "FlipRoom"("playerBWallet");

-- CreateIndex
CREATE INDEX "FlipRoom_status_idx" ON "FlipRoom"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FlipRoom_roomSlot_tierLamports_key" ON "FlipRoom"("roomSlot", "tierLamports");

-- CreateIndex
CREATE UNIQUE INDEX "FlipHistory_serverSeedHash_key" ON "FlipHistory"("serverSeedHash");

-- CreateIndex
CREATE INDEX "FlipHistory_completedAt_idx" ON "FlipHistory"("completedAt");

-- CreateIndex
CREATE INDEX "FlipHistory_playerAWallet_idx" ON "FlipHistory"("playerAWallet");

-- CreateIndex
CREATE INDEX "FlipHistory_playerBWallet_idx" ON "FlipHistory"("playerBWallet");
