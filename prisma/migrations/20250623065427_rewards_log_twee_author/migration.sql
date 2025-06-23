-- AlterTable
ALTER TABLE "RewardsLog" ADD COLUMN     "tweetAuthorId" TEXT,
ADD COLUMN     "tweetIds" TEXT[];

-- CreateIndex
CREATE INDEX "RewardsLog_playerId_pollId_idx" ON "RewardsLog"("playerId", "pollId");

-- CreateIndex
CREATE INDEX "RewardsLog_playerId_questId_idx" ON "RewardsLog"("playerId", "questId");

-- CreateIndex
CREATE INDEX "RewardsLog_tweetAuthorId_idx" ON "RewardsLog"("tweetAuthorId");

-- CreateIndex
CREATE INDEX "RewardsLog_tweetIds_idx" ON "RewardsLog"("tweetIds");

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_tweetAuthorId_fkey" FOREIGN KEY ("tweetAuthorId") REFERENCES "TweetAuthor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
