/*
  Warnings:

  - A unique constraint covering the columns `[playerId,questId]` on the table `QuestLog` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "QuestLog_playerId_questId_key" ON "QuestLog"("playerId", "questId");
