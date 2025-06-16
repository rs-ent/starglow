-- AlterTable
ALTER TABLE "TweetAuthor" ADD COLUMN     "blacklistedAt" TIMESTAMP(3),
ADD COLUMN     "isBlacklisted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TweetAuthorBlacklist" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "reason" TEXT,
    "tweetCount" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TweetAuthorBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TweetAuthorBlacklist_authorId_key" ON "TweetAuthorBlacklist"("authorId");

-- CreateIndex
CREATE INDEX "TweetAuthorBlacklist_isActive_idx" ON "TweetAuthorBlacklist"("isActive");

-- CreateIndex
CREATE INDEX "TweetAuthor_isBlacklisted_idx" ON "TweetAuthor"("isBlacklisted");

-- CreateIndex
CREATE INDEX "TweetAuthorMetrics_tweetAuthorId_idx" ON "TweetAuthorMetrics"("tweetAuthorId");

-- AddForeignKey
ALTER TABLE "TweetAuthorBlacklist" ADD CONSTRAINT "TweetAuthorBlacklist_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "TweetAuthor"("authorId") ON DELETE RESTRICT ON UPDATE CASCADE;
