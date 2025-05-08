-- CreateIndex
CREATE INDEX "QuestLog_questId_idx" ON "QuestLog"("questId");

-- CreateIndex
CREATE INDEX "QuestLog_playerId_questId_idx" ON "QuestLog"("playerId", "questId");

-- CreateIndex
CREATE INDEX "QuestLog_playerId_questId_deprecated_completed_idx" ON "QuestLog"("playerId", "questId", "deprecated", "completed");

-- CreateIndex
CREATE INDEX "QuestLog_playerId_questId_deprecated_isClaimed_idx" ON "QuestLog"("playerId", "questId", "deprecated", "isClaimed");

-- CreateIndex
CREATE INDEX "QuestLog_playerId_questId_deprecated_completed_isClaimed_idx" ON "QuestLog"("playerId", "questId", "deprecated", "completed", "isClaimed");
