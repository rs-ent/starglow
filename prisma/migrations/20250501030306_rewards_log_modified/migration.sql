/*
  Warnings:

  - You are about to drop the column `currency` on the `RewardsLog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "RewardsLog_playerId_currency_createdAt_idx";

-- AlterTable
ALTER TABLE "RewardsLog" DROP COLUMN "currency",
ADD COLUMN     "assetId" TEXT,
ADD COLUMN     "balanceAfter" INTEGER,
ADD COLUMN     "balanceBefore" INTEGER;

-- CreateIndex
CREATE INDEX "RewardsLog_playerId_assetId_idx" ON "RewardsLog"("playerId", "assetId");

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
