/*
  Warnings:

  - You are about to drop the column `claimableAt` on the `StakeReward` table. All the data in the column will be lost.
  - You are about to drop the column `distributedAt` on the `StakeReward` table. All the data in the column will be lost.
  - You are about to drop the column `isClaimed` on the `StakeReward` table. All the data in the column will be lost.
  - You are about to drop the column `isDistributed` on the `StakeReward` table. All the data in the column will be lost.
  - You are about to drop the column `nftId` on the `StakeReward` table. All the data in the column will be lost.
  - Added the required column `stakeDuration` to the `StakeReward` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StakeReward" DROP CONSTRAINT "StakeReward_nftId_fkey";

-- DropIndex
DROP INDEX "StakeReward_assetId_idx";

-- DropIndex
DROP INDEX "StakeReward_nftId_idx";

-- AlterTable
ALTER TABLE "StakeReward" DROP COLUMN "claimableAt",
DROP COLUMN "distributedAt",
DROP COLUMN "isClaimed",
DROP COLUMN "isDistributed",
DROP COLUMN "nftId",
ADD COLUMN     "stakeDuration" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "StakeRewardLog" (
    "id" TEXT NOT NULL,
    "stakeRewardId" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "isDistributed" BOOLEAN NOT NULL DEFAULT false,
    "distributedAt" TIMESTAMP(3),
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StakeRewardLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StakeRewardLog_stakeRewardId_idx" ON "StakeRewardLog"("stakeRewardId");

-- CreateIndex
CREATE INDEX "StakeRewardLog_nftId_idx" ON "StakeRewardLog"("nftId");

-- AddForeignKey
ALTER TABLE "StakeRewardLog" ADD CONSTRAINT "StakeRewardLog_stakeRewardId_fkey" FOREIGN KEY ("stakeRewardId") REFERENCES "StakeReward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeRewardLog" ADD CONSTRAINT "StakeRewardLog_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
