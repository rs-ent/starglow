-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'DRAWING', 'COMPLETED', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "RaffleCategory" AS ENUM ('GENERAL', 'ARTIST_EXCLUSIVE', 'VIP', 'MILESTONE', 'SEASONAL', 'PROMOTIONAL');

-- CreateEnum
CREATE TYPE "RafflePrizeType" AS ENUM ('ASSET', 'NFT', 'MIXED');

-- CreateEnum
CREATE TYPE "RafflePrizeStatus" AS ENUM ('PENDING', 'PROCESSING', 'DISTRIBUTED', 'CLAIMED', 'FAILED', 'EXPIRED');

-- AlterTable
ALTER TABLE "RewardsLog" ADD COLUMN     "raffleId" TEXT,
ADD COLUMN     "raffleParticipantId" TEXT;

-- CreateTable
CREATE TABLE "Raffle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imgUrl" TEXT,
    "bannerUrl" TEXT,
    "minimumPoints" INTEGER,
    "minimumSGP" INTEGER,
    "minimumSGT" INTEGER,
    "requiredQuests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredAssetId" TEXT,
    "requiredAssetAmount" INTEGER,
    "entryFeeAssetId" TEXT,
    "entryFeeAmount" INTEGER NOT NULL DEFAULT 0,
    "needToken" BOOLEAN NOT NULL DEFAULT false,
    "needTokenAddress" TEXT,
    "prizeType" "RafflePrizeType" NOT NULL,
    "prizeDescription" TEXT,
    "prizeAssetId" TEXT,
    "prizeAssetAmount" INTEGER,
    "prizeSPGAddress" TEXT,
    "prizeNFTQuantity" INTEGER NOT NULL DEFAULT 1,
    "maxParticipants" INTEGER,
    "winnersCount" INTEGER NOT NULL DEFAULT 1,
    "allowMultipleEntry" BOOLEAN NOT NULL DEFAULT false,
    "maxEntriesPerUser" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "drawDate" TIMESTAMP(3),
    "status" "RaffleStatus" NOT NULL DEFAULT 'UPCOMING',
    "totalParticipants" INTEGER NOT NULL DEFAULT 0,
    "totalEntries" INTEGER NOT NULL DEFAULT 0,
    "drawnAt" TIMESTAMP(3),
    "drawnBy" TEXT,
    "randomSeed" TEXT,
    "verificationHash" TEXT,
    "artistId" TEXT,
    "category" "RaffleCategory" NOT NULL DEFAULT 'GENERAL',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "hideParticipants" BOOLEAN NOT NULL DEFAULT false,
    "hideResults" BOOLEAN NOT NULL DEFAULT false,
    "resultVisibleDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Raffle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleParticipant" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "entryCount" INTEGER NOT NULL DEFAULT 1,
    "totalFeePaid" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaffleParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleWinner" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "prizeType" "RafflePrizeType" NOT NULL,
    "prizeAssetId" TEXT,
    "prizeAssetAmount" INTEGER,
    "prizeSPGAddress" TEXT,
    "prizeNFTQuantity" INTEGER,
    "prizeNFTTokenIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "RafflePrizeStatus" NOT NULL DEFAULT 'PENDING',
    "claimedAt" TIMESTAMP(3),
    "distributedAt" TIMESTAMP(3),
    "transactionHash" TEXT,
    "failureReason" TEXT,
    "randomValue" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaffleWinner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Raffle_status_startDate_endDate_idx" ON "Raffle"("status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Raffle_artistId_status_idx" ON "Raffle"("artistId", "status");

-- CreateIndex
CREATE INDEX "Raffle_category_status_idx" ON "Raffle"("category", "status");

-- CreateIndex
CREATE INDEX "Raffle_isActive_isPublic_idx" ON "Raffle"("isActive", "isPublic");

-- CreateIndex
CREATE INDEX "Raffle_startDate_endDate_idx" ON "Raffle"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Raffle_drawnAt_idx" ON "Raffle"("drawnAt");

-- CreateIndex
CREATE INDEX "RaffleParticipant_raffleId_idx" ON "RaffleParticipant"("raffleId");

-- CreateIndex
CREATE INDEX "RaffleParticipant_playerId_idx" ON "RaffleParticipant"("playerId");

-- CreateIndex
CREATE INDEX "RaffleParticipant_raffleId_entryCount_idx" ON "RaffleParticipant"("raffleId", "entryCount");

-- CreateIndex
CREATE INDEX "RaffleParticipant_createdAt_idx" ON "RaffleParticipant"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RaffleParticipant_raffleId_playerId_key" ON "RaffleParticipant"("raffleId", "playerId");

-- CreateIndex
CREATE INDEX "RaffleWinner_raffleId_idx" ON "RaffleWinner"("raffleId");

-- CreateIndex
CREATE INDEX "RaffleWinner_playerId_idx" ON "RaffleWinner"("playerId");

-- CreateIndex
CREATE INDEX "RaffleWinner_status_idx" ON "RaffleWinner"("status");

-- CreateIndex
CREATE INDEX "RaffleWinner_distributedAt_idx" ON "RaffleWinner"("distributedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RaffleWinner_raffleId_playerId_key" ON "RaffleWinner"("raffleId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "RaffleWinner_raffleId_position_key" ON "RaffleWinner"("raffleId", "position");

-- CreateIndex
CREATE INDEX "RewardsLog_playerId_raffleId_idx" ON "RewardsLog"("playerId", "raffleId");

-- CreateIndex
CREATE INDEX "RewardsLog_raffleId_idx" ON "RewardsLog"("raffleId");

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_raffleParticipantId_fkey" FOREIGN KEY ("raffleParticipantId") REFERENCES "RaffleParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_prizeAssetId_fkey" FOREIGN KEY ("prizeAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_entryFeeAssetId_fkey" FOREIGN KEY ("entryFeeAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_requiredAssetId_fkey" FOREIGN KEY ("requiredAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_prizeSPGAddress_fkey" FOREIGN KEY ("prizeSPGAddress") REFERENCES "Story_spg"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleParticipant" ADD CONSTRAINT "RaffleParticipant_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleParticipant" ADD CONSTRAINT "RaffleParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleWinner" ADD CONSTRAINT "RaffleWinner_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleWinner" ADD CONSTRAINT "RaffleWinner_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleWinner" ADD CONSTRAINT "RaffleWinner_prizeAssetId_fkey" FOREIGN KEY ("prizeAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleWinner" ADD CONSTRAINT "RaffleWinner_prizeSPGAddress_fkey" FOREIGN KEY ("prizeSPGAddress") REFERENCES "Story_spg"("address") ON DELETE SET NULL ON UPDATE CASCADE;
