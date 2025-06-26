/*
  Warnings:

  - You are about to drop the column `prizeAssetAmount` on the `Raffle` table. All the data in the column will be lost.
  - You are about to drop the column `prizeAssetId` on the `Raffle` table. All the data in the column will be lost.
  - You are about to drop the column `prizeDescription` on the `Raffle` table. All the data in the column will be lost.
  - You are about to drop the column `prizeNFTQuantity` on the `Raffle` table. All the data in the column will be lost.
  - You are about to drop the column `prizeSPGAddress` on the `Raffle` table. All the data in the column will be lost.
  - You are about to drop the column `prizeType` on the `Raffle` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Raffle" DROP CONSTRAINT "Raffle_prizeAssetId_fkey";

-- DropForeignKey
ALTER TABLE "Raffle" DROP CONSTRAINT "Raffle_prizeSPGAddress_fkey";

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "artistId" TEXT;

-- AlterTable
ALTER TABLE "Raffle" DROP COLUMN "prizeAssetAmount",
DROP COLUMN "prizeAssetId",
DROP COLUMN "prizeDescription",
DROP COLUMN "prizeNFTQuantity",
DROP COLUMN "prizeSPGAddress",
DROP COLUMN "prizeType";

-- AlterTable
ALTER TABLE "RaffleWinner" ADD COLUMN     "rafflePrizeId" TEXT;

-- CreateTable
CREATE TABLE "RafflePrize" (
    "id" TEXT NOT NULL,
    "raffleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "prizeType" "RafflePrizeType" NOT NULL,
    "prizeAssetId" TEXT,
    "prizeAssetAmount" INTEGER,
    "prizeSPGAddress" TEXT,
    "prizeNFTQuantity" INTEGER,
    "winnersCount" INTEGER NOT NULL DEFAULT 1,
    "winProbabilityPercent" DOUBLE PRECISION,
    "weightingStrategy" "RaffleWeightingStrategy" NOT NULL DEFAULT 'EQUAL',
    "customWeightRules" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "autoDistribute" BOOLEAN NOT NULL DEFAULT false,
    "requireManualApproval" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RafflePrize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RafflePrize_raffleId_order_idx" ON "RafflePrize"("raffleId", "order");

-- CreateIndex
CREATE INDEX "RafflePrize_raffleId_isActive_idx" ON "RafflePrize"("raffleId", "isActive");

-- CreateIndex
CREATE INDEX "RafflePrize_prizeType_idx" ON "RafflePrize"("prizeType");

-- CreateIndex
CREATE INDEX "RafflePrize_winProbabilityPercent_idx" ON "RafflePrize"("winProbabilityPercent");

-- CreateIndex
CREATE INDEX "Asset_artistId_idx" ON "Asset"("artistId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleWinner" ADD CONSTRAINT "RaffleWinner_rafflePrizeId_fkey" FOREIGN KEY ("rafflePrizeId") REFERENCES "RafflePrize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RafflePrize" ADD CONSTRAINT "RafflePrize_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RafflePrize" ADD CONSTRAINT "RafflePrize_prizeAssetId_fkey" FOREIGN KEY ("prizeAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RafflePrize" ADD CONSTRAINT "RafflePrize_prizeSPGAddress_fkey" FOREIGN KEY ("prizeSPGAddress") REFERENCES "Story_spg"("address") ON DELETE SET NULL ON UPDATE CASCADE;
