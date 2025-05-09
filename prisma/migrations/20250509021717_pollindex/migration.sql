-- DropIndex
DROP INDEX "Poll_bettingMode_status_idx";

-- DropIndex
DROP INDEX "Poll_category_status_idx";

-- DropIndex
DROP INDEX "Poll_needToken_status_idx";

-- DropIndex
DROP INDEX "Poll_status_startDate_endDate_idx";

-- DropIndex
DROP INDEX "PollLog_createdAt_idx";

-- DropIndex
DROP INDEX "PollLog_pollId_optionId_idx";

-- CreateIndex
CREATE INDEX "Poll_category_idx" ON "Poll"("category");

-- CreateIndex
CREATE INDEX "Poll_artistId_idx" ON "Poll"("artistId");

-- CreateIndex
CREATE INDEX "PollLog_playerId_idx" ON "PollLog"("playerId");

-- CreateIndex
CREATE INDEX "PollLog_pollId_idx" ON "PollLog"("pollId");
