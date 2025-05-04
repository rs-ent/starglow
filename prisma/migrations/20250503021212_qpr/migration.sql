/*
  Warnings:

  - You are about to drop the column `rewardCurrency` on the `QuestLog` table. All the data in the column will be lost.
  - You are about to drop the column `rewards` on the `QuestLog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "QuestLog_completedAt_rewardCurrency_idx";

-- AlterTable
ALTER TABLE "PollLog" ADD COLUMN     "rewardAmount" INTEGER,
ADD COLUMN     "rewardAssetId" TEXT;

-- AlterTable
ALTER TABLE "QuestLog" DROP COLUMN "rewardCurrency",
DROP COLUMN "rewards",
ADD COLUMN     "rewardAmount" INTEGER,
ADD COLUMN     "rewardAssetId" TEXT;

-- CreateIndex
CREATE INDEX "QuestLog_completedAt_idx" ON "QuestLog"("completedAt");
