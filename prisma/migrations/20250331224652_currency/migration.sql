-- DropIndex
DROP INDEX "Player_userId_telegramId_idx";

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "SGP" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "SGT" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PointsLog" ADD COLUMN     "currency" "RewardCurrency" NOT NULL DEFAULT 'Points',
ADD COLUMN     "pollId" TEXT,
ADD COLUMN     "pollLogId" TEXT,
ADD COLUMN     "questId" TEXT,
ADD COLUMN     "questLogId" TEXT;

-- CreateIndex
CREATE INDEX "Player_userId_telegramId_id_idx" ON "Player"("userId", "telegramId", "id");

-- AddForeignKey
ALTER TABLE "PointsLog" ADD CONSTRAINT "PointsLog_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLog" ADD CONSTRAINT "PointsLog_questLogId_fkey" FOREIGN KEY ("questLogId") REFERENCES "QuestLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLog" ADD CONSTRAINT "PointsLog_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLog" ADD CONSTRAINT "PointsLog_pollLogId_fkey" FOREIGN KEY ("pollLogId") REFERENCES "PollLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
