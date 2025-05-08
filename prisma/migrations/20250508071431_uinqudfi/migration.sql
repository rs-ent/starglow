-- DropIndex
DROP INDEX "QuestLog_completedAt_idx";

-- DropIndex
DROP INDEX "QuestLog_playerId_questId_completed_idx";

-- CreateIndex
CREATE INDEX "QuestLog_playerId_idx" ON "QuestLog"("playerId");

-- CreateIndex
CREATE INDEX "QuestLog_playerId_questId_deprecated_idx" ON "QuestLog"("playerId", "questId", "deprecated");
