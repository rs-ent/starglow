/*
  Warnings:

  - A unique constraint covering the columns `[playerId,questId]` on the table `QuestLog` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "QuestLog_playerId_idx";

-- DropIndex
DROP INDEX "QuestLog_playerId_questId_deprecated_completed_idx";

-- DropIndex
DROP INDEX "QuestLog_playerId_questId_deprecated_completed_isClaimed_idx";

-- DropIndex
DROP INDEX "QuestLog_playerId_questId_deprecated_isClaimed_idx";

-- DropIndex
DROP INDEX "QuestLog_playerId_questId_idx";

-- DropIndex
DROP INDEX "QuestLog_questId_idx";

-- CreateIndex
CREATE INDEX "QuestLog_completedAt_idx" ON "QuestLog"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuestLog_playerId_questId_key" ON "QuestLog"("playerId", "questId");
