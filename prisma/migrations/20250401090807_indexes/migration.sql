-- DropIndex
DROP INDEX "Poll_id_startDate_endDate_exposeInScheduleTab_idx";

-- DropIndex
DROP INDEX "PollLog_playerId_pollId_key";

-- DropIndex
DROP INDEX "PollLog_playerId_pollId_option_idx";

-- DropIndex
DROP INDEX "Quest_startDate_endDate_permanent_idx";

-- DropIndex
DROP INDEX "QuestLog_playerId_questId_completed_idx";

-- DropIndex
DROP INDEX "QuestLog_playerId_questId_key";

-- DropIndex
DROP INDEX "RewardsLog_playerId_createdAt_idx";

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Quest_startDate_idx" ON "Quest"("startDate");

-- CreateIndex
CREATE INDEX "Quest_permanent_visible_idx" ON "Quest"("permanent", "visible");

-- CreateIndex
CREATE INDEX "Quest_primary_idx" ON "Quest"("primary");

-- CreateIndex
CREATE INDEX "QuestLog_playerId_completed_idx" ON "QuestLog"("playerId", "completed");
