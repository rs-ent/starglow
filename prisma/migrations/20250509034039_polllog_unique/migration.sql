/*
  Warnings:

  - A unique constraint covering the columns `[playerId,pollId,optionId]` on the table `PollLog` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PollLog_playerId_pollId_optionId_key" ON "PollLog"("playerId", "pollId", "optionId");
