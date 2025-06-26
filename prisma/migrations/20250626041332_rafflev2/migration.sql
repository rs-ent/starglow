-- CreateEnum
CREATE TYPE "RafflePrizeType" AS ENUM ('ASSET', 'NFT', 'EMPTY');

-- CreateEnum
CREATE TYPE "RafflePrizeStatus" AS ENUM ('PENDING', 'PROCESSING', 'DISTRIBUTED', 'CLAIMED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Raffle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imgUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "drawDate" TIMESTAMP(3),
    "instantReveal" BOOLEAN NOT NULL DEFAULT true,
    "displayType" TEXT NOT NULL DEFAULT 'GACHA',
    "maxParticipants" INTEGER,
    "minimumPoints" INTEGER,
    "minimumSGP" INTEGER,
    "entryFeeAssetId" TEXT,
    "entryFeeAmount" INTEGER NOT NULL DEFAULT 0,
    "allowMultipleEntry" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "artistId" TEXT,
    "totalSlots" INTEGER NOT NULL DEFAULT 0,
    "totalParticipants" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Raffle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RafflePrize" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL,
    "prizeType" "RafflePrizeType" NOT NULL,
    "assetId" TEXT,
    "assetAmount" INTEGER,
    "spgAddress" TEXT,
    "nftQuantity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RafflePrize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleParticipant" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "prizeId" TEXT,
    "drawnAt" TIMESTAMP(3),
    "revealedAt" TIMESTAMP(3),
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "slotNumber" INTEGER,
    "randomSeed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaffleParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleWinner" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "RafflePrizeStatus" NOT NULL DEFAULT 'PENDING',
    "distributedAt" TIMESTAMP(3),
    "transactionHash" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaffleWinner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Raffle_startDate_endDate_idx" ON "Raffle"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Raffle_artistId_idx" ON "Raffle"("artistId");

-- CreateIndex
CREATE INDEX "Raffle_isActive_isPublic_idx" ON "Raffle"("isActive", "isPublic");

-- CreateIndex
CREATE INDEX "Raffle_displayType_idx" ON "Raffle"("displayType");

-- CreateIndex
CREATE INDEX "RafflePrize_raffleId_order_idx" ON "RafflePrize"("raffleId", "order");

-- CreateIndex
CREATE INDEX "RafflePrize_raffleId_isActive_idx" ON "RafflePrize"("raffleId", "isActive");

-- CreateIndex
CREATE INDEX "RafflePrize_prizeType_idx" ON "RafflePrize"("prizeType");

-- CreateIndex
CREATE INDEX "RafflePrize_quantity_idx" ON "RafflePrize"("quantity");

-- CreateIndex
CREATE INDEX "RaffleParticipant_raffleId_idx" ON "RaffleParticipant"("raffleId");

-- CreateIndex
CREATE INDEX "RaffleParticipant_playerId_idx" ON "RaffleParticipant"("playerId");

-- CreateIndex
CREATE INDEX "RaffleParticipant_drawnAt_idx" ON "RaffleParticipant"("drawnAt");

-- CreateIndex
CREATE INDEX "RaffleParticipant_revealedAt_idx" ON "RaffleParticipant"("revealedAt");

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

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_raffleParticipantId_fkey" FOREIGN KEY ("raffleParticipantId") REFERENCES "RaffleParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raffle" ADD CONSTRAINT "Raffle_entryFeeAssetId_fkey" FOREIGN KEY ("entryFeeAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RafflePrize" ADD CONSTRAINT "RafflePrize_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RafflePrize" ADD CONSTRAINT "RafflePrize_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RafflePrize" ADD CONSTRAINT "RafflePrize_spgAddress_fkey" FOREIGN KEY ("spgAddress") REFERENCES "Story_spg"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleParticipant" ADD CONSTRAINT "RaffleParticipant_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleParticipant" ADD CONSTRAINT "RaffleParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleParticipant" ADD CONSTRAINT "RaffleParticipant_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "RafflePrize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleWinner" ADD CONSTRAINT "RaffleWinner_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleWinner" ADD CONSTRAINT "RaffleWinner_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "RafflePrize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleWinner" ADD CONSTRAINT "RaffleWinner_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
