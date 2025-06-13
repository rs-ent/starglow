/*
  Warnings:

  - Added the required column `updatedAt` to the `Tweet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tweet" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "TweetAuthorMetrics" (
    "id" TEXT NOT NULL,
    "tweetAuthorId" TEXT NOT NULL,
    "followersCount" INTEGER NOT NULL,
    "followingCount" INTEGER NOT NULL,
    "tweetCount" INTEGER NOT NULL,
    "listedCount" INTEGER NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TweetAuthorMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TweetMetrics" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "replyCount" INTEGER NOT NULL,
    "retweetCount" INTEGER NOT NULL,
    "likeCount" INTEGER NOT NULL,
    "quoteCount" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TweetMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TweetMedia" (
    "id" TEXT NOT NULL,
    "mediaKey" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "previewImageUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "durationMs" INTEGER,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TweetMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TweetMetrics_tweetId_recordedAt_idx" ON "TweetMetrics"("tweetId", "recordedAt");

-- CreateIndex
CREATE INDEX "TweetMetrics_recordedAt_idx" ON "TweetMetrics"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TweetMedia_mediaKey_key" ON "TweetMedia"("mediaKey");

-- CreateIndex
CREATE INDEX "TweetMedia_tweetId_idx" ON "TweetMedia"("tweetId");

-- CreateIndex
CREATE INDEX "TweetMedia_mediaKey_idx" ON "TweetMedia"("mediaKey");

-- AddForeignKey
ALTER TABLE "TweetAuthorMetrics" ADD CONSTRAINT "TweetAuthorMetrics_tweetAuthorId_fkey" FOREIGN KEY ("tweetAuthorId") REFERENCES "TweetAuthor"("authorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TweetMetrics" ADD CONSTRAINT "TweetMetrics_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("tweetId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TweetMedia" ADD CONSTRAINT "TweetMedia_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "Tweet"("tweetId") ON DELETE RESTRICT ON UPDATE CASCADE;
