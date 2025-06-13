-- CreateTable
CREATE TABLE "TweetSyncData" (
    "id" SERIAL NOT NULL,
    "lastTweetId" TEXT,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncStatus" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "totalTweetsFound" INTEGER NOT NULL DEFAULT 0,
    "newTweetsAdded" INTEGER NOT NULL DEFAULT 0,
    "apiRequestsUsed" INTEGER NOT NULL DEFAULT 0,
    "rateLimitRemaining" INTEGER,
    "executionTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TweetSyncData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TweetResponse" (
    "id" TEXT NOT NULL,
    "tweetSyncDataId" INTEGER NOT NULL,
    "rawResponse" JSONB NOT NULL,
    "requestParams" JSONB NOT NULL,
    "responseCode" INTEGER NOT NULL,
    "requestTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingTimeMs" INTEGER,

    CONSTRAINT "TweetResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TweetSyncData_lastSyncAt_idx" ON "TweetSyncData"("lastSyncAt");

-- CreateIndex
CREATE INDEX "TweetResponse_tweetSyncDataId_idx" ON "TweetResponse"("tweetSyncDataId");

-- CreateIndex
CREATE INDEX "TweetResponse_requestTimestamp_idx" ON "TweetResponse"("requestTimestamp");

-- CreateIndex
CREATE INDEX "Tweet_tweetId_idx" ON "Tweet"("tweetId");

-- CreateIndex
CREATE INDEX "Tweet_createdAt_idx" ON "Tweet"("createdAt");

-- AddForeignKey
ALTER TABLE "TweetResponse" ADD CONSTRAINT "TweetResponse_tweetSyncDataId_fkey" FOREIGN KEY ("tweetSyncDataId") REFERENCES "TweetSyncData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
