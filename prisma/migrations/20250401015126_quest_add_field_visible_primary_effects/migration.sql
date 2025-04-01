/*
  Warnings:

  - You are about to drop the `PointsLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PointsLog" DROP CONSTRAINT "PointsLog_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PointsLog" DROP CONSTRAINT "PointsLog_pollId_fkey";

-- DropForeignKey
ALTER TABLE "PointsLog" DROP CONSTRAINT "PointsLog_pollLogId_fkey";

-- DropForeignKey
ALTER TABLE "PointsLog" DROP CONSTRAINT "PointsLog_questId_fkey";

-- DropForeignKey
ALTER TABLE "PointsLog" DROP CONSTRAINT "PointsLog_questLogId_fkey";

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "effects" TEXT,
ADD COLUMN     "primary" INTEGER DEFAULT 0,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "PointsLog";

-- CreateTable
CREATE TABLE "RewardsLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "questId" TEXT,
    "questLogId" TEXT,
    "pollId" TEXT,
    "pollLogId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" "RewardCurrency" NOT NULL DEFAULT 'points',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardsLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RewardsLog_playerId_createdAt_idx" ON "RewardsLog"("playerId", "createdAt");

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_questLogId_fkey" FOREIGN KEY ("questLogId") REFERENCES "QuestLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_pollLogId_fkey" FOREIGN KEY ("pollLogId") REFERENCES "PollLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
