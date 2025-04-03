-- CreateEnum
CREATE TYPE "RewardCurrency" AS ENUM ('points', 'SGP', 'SGT');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('concert', 'fanmeeting', 'fancamp', 'festival', 'exhibition', 'other');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "privateKey" TEXT,
    "network" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "default" BOOLEAN NOT NULL DEFAULT false,
    "primary" INTEGER DEFAULT 0,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramId" TEXT,
    "name" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "SGP" INTEGER NOT NULL DEFAULT 0,
    "SGT" INTEGER NOT NULL DEFAULT 0,
    "recommendedCount" INTEGER NOT NULL DEFAULT 0,
    "recommenderId" TEXT,
    "recommenderName" TEXT,
    "recommenderMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastConnectedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "icon" TEXT,
    "rewards" INTEGER NOT NULL DEFAULT 800,
    "rewardCurrency" "RewardCurrency" NOT NULL DEFAULT 'points',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "permanent" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "primary" INTEGER DEFAULT 0,
    "effects" TEXT,
    "type" TEXT,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewards" INTEGER NOT NULL DEFAULT 0,
    "rewardCurrency" "RewardCurrency" NOT NULL DEFAULT 'points',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleShorten" TEXT,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "optionsShorten" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bannerImg" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exposeInScheduleTab" BOOLEAN NOT NULL DEFAULT false,
    "openPromotionText" TEXT,
    "openPromotionImg" TEXT,
    "resultPromotionText" TEXT,
    "resultPromotionImg" TEXT,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "totalVotesByOption" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "totalBetsAmount" INTEGER NOT NULL DEFAULT 0,
    "totalBetsAmountByOption" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "results" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "option" TEXT NOT NULL,
    "betAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardsLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "questId" TEXT,
    "questLogId" TEXT,
    "pollId" TEXT,
    "pollLogId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" "RewardCurrency" NOT NULL DEFAULT 'points',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Events" (
    "id" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL DEFAULT 'other',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB,
    "url" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'upcoming',
    "bannerImg" TEXT,
    "bannerImg2" TEXT,
    "galleryImgs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "detailImg" JSONB,
    "saleStartDate" TIMESTAMP(3),
    "saleEndDate" TIMESTAMP(3),
    "price" INTEGER,
    "capacity" INTEGER,
    "ageLimit" INTEGER,
    "organizer" TEXT,
    "organizerImg" TEXT,
    "organizerUrl" TEXT,
    "contact" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "locationAddress" TEXT,
    "locationImg" TEXT,
    "locationUrl" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "artist" TEXT,
    "artistImg" TEXT,
    "artistUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "promotionText" TEXT,
    "promotionImg" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredImage" (
    "id" TEXT NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "type" VARCHAR(50),
    "sourceUrl" VARCHAR(2048),
    "alt" VARCHAR(255),
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" VARCHAR(50),
    "sizeBytes" INTEGER,
    "metadata" JSONB,
    "onBanner" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoredImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_userId_address_idx" ON "Wallet"("userId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_telegramId_key" ON "Player"("telegramId");

-- CreateIndex
CREATE INDEX "Player_userId_telegramId_id_idx" ON "Player"("userId", "telegramId", "id");

-- CreateIndex
CREATE INDEX "Quest_startDate_idx" ON "Quest"("startDate");

-- CreateIndex
CREATE INDEX "Quest_permanent_visible_idx" ON "Quest"("permanent", "visible");

-- CreateIndex
CREATE INDEX "Quest_primary_idx" ON "Quest"("primary");

-- CreateIndex
CREATE INDEX "QuestLog_playerId_completed_idx" ON "QuestLog"("playerId", "completed");

-- CreateIndex
CREATE INDEX "Events_category_idx" ON "Events"("category");

-- CreateIndex
CREATE INDEX "Events_status_idx" ON "Events"("status");

-- CreateIndex
CREATE INDEX "Events_saleStartDate_idx" ON "Events"("saleStartDate");

-- CreateIndex
CREATE INDEX "Events_saleEndDate_idx" ON "Events"("saleEndDate");

-- CreateIndex
CREATE INDEX "Events_price_idx" ON "Events"("price");

-- CreateIndex
CREATE INDEX "Events_category_status_idx" ON "Events"("category", "status");

-- CreateIndex
CREATE INDEX "Events_isFeatured_idx" ON "Events"("isFeatured");

-- CreateIndex
CREATE INDEX "Events_isActive_idx" ON "Events"("isActive");

-- CreateIndex
CREATE INDEX "Events_startDate_idx" ON "Events"("startDate");

-- CreateIndex
CREATE INDEX "Events_endDate_idx" ON "Events"("endDate");

-- CreateIndex
CREATE INDEX "Events_location_idx" ON "Events"("location");

-- CreateIndex
CREATE INDEX "Events_title_idx" ON "Events"("title");

-- CreateIndex
CREATE UNIQUE INDEX "StoredImage_url_key" ON "StoredImage"("url");

-- CreateIndex
CREATE INDEX "StoredImage_url_sourceUrl_idx" ON "StoredImage"("url", "sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "StoredImage_sourceUrl_type_key" ON "StoredImage"("sourceUrl", "type");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestLog" ADD CONSTRAINT "QuestLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestLog" ADD CONSTRAINT "QuestLog_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollLog" ADD CONSTRAINT "PollLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollLog" ADD CONSTRAINT "PollLog_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_questLogId_fkey" FOREIGN KEY ("questLogId") REFERENCES "QuestLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_pollLogId_fkey" FOREIGN KEY ("pollLogId") REFERENCES "PollLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
