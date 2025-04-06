-- CreateEnum
CREATE TYPE "RewardCurrency" AS ENUM ('points', 'SGP', 'SGT');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('concert', 'fanmeeting', 'fancamp', 'festival', 'exhibition', 'other');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INIT', 'COMPLETED', 'CANCELLED', 'FAILED', 'REFUNDED');

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
    "userId" TEXT,
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
CREATE TABLE "StoredFiles" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255),
    "url" VARCHAR(2048) NOT NULL,
    "type" VARCHAR(50),
    "sourceUrl" VARCHAR(2048),
    "alt" VARCHAR(255),
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" VARCHAR(50),
    "sizeBytes" INTEGER,
    "metadata" JSONB,
    "order" INTEGER DEFAULT 0,
    "purpose" VARCHAR(50),
    "bucket" VARCHAR(50) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoredFiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttemptLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "provider" TEXT,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttemptLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "orderedProductId" TEXT NOT NULL,
    "orderedProductName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "method" TEXT NOT NULL DEFAULT 'PAYPAL',
    "status" "PaymentStatus" NOT NULL DEFAULT 'INIT',
    "paymentKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "failureReason" TEXT,
    "cancelReason" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_active_idx" ON "User"("email", "active");

-- CreateIndex
CREATE INDEX "User_role_active_idx" ON "User"("role", "active");

-- CreateIndex
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");

-- CreateIndex
CREATE INDEX "Account_userId_provider_idx" ON "Account"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_unique" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_expires_idx" ON "Session"("userId", "expires");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_userId_network_default_idx" ON "Wallet"("userId", "network", "default");

-- CreateIndex
CREATE INDEX "Wallet_address_network_idx" ON "Wallet"("address", "network");

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_telegramId_key" ON "Player"("telegramId");

-- CreateIndex
CREATE INDEX "Player_userId_telegramId_idx" ON "Player"("userId", "telegramId");

-- CreateIndex
CREATE INDEX "Player_points_SGP_SGT_idx" ON "Player"("points", "SGP", "SGT");

-- CreateIndex
CREATE INDEX "Player_recommenderId_idx" ON "Player"("recommenderId");

-- CreateIndex
CREATE INDEX "Quest_permanent_visible_startDate_idx" ON "Quest"("permanent", "visible", "startDate");

-- CreateIndex
CREATE INDEX "Quest_type_visible_idx" ON "Quest"("type", "visible");

-- CreateIndex
CREATE INDEX "Quest_primary_visible_idx" ON "Quest"("primary", "visible");

-- CreateIndex
CREATE INDEX "QuestLog_playerId_questId_completed_idx" ON "QuestLog"("playerId", "questId", "completed");

-- CreateIndex
CREATE INDEX "QuestLog_completedAt_rewardCurrency_idx" ON "QuestLog"("completedAt", "rewardCurrency");

-- CreateIndex
CREATE INDEX "Poll_startDate_endDate_exposeInScheduleTab_idx" ON "Poll"("startDate", "endDate", "exposeInScheduleTab");

-- CreateIndex
CREATE INDEX "Poll_totalVotes_totalBetsAmount_idx" ON "Poll"("totalVotes", "totalBetsAmount");

-- CreateIndex
CREATE INDEX "PollLog_playerId_pollId_idx" ON "PollLog"("playerId", "pollId");

-- CreateIndex
CREATE INDEX "PollLog_pollId_option_idx" ON "PollLog"("pollId", "option");

-- CreateIndex
CREATE INDEX "RewardsLog_playerId_currency_createdAt_idx" ON "RewardsLog"("playerId", "currency", "createdAt");

-- CreateIndex
CREATE INDEX "RewardsLog_questId_pollId_idx" ON "RewardsLog"("questId", "pollId");

-- CreateIndex
CREATE INDEX "Events_category_status_startDate_idx" ON "Events"("category", "status", "startDate");

-- CreateIndex
CREATE INDEX "Events_location_startDate_idx" ON "Events"("location", "startDate");

-- CreateIndex
CREATE INDEX "Events_isFeatured_isActive_startDate_idx" ON "Events"("isFeatured", "isActive", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "StoredFiles_url_key" ON "StoredFiles"("url");

-- CreateIndex
CREATE INDEX "StoredFiles_bucket_purpose_idx" ON "StoredFiles"("bucket", "purpose");

-- CreateIndex
CREATE INDEX "StoredFiles_url_type_idx" ON "StoredFiles"("url", "type");

-- CreateIndex
CREATE UNIQUE INDEX "StoredFiles_sourceUrl_type_key" ON "StoredFiles"("sourceUrl", "type");

-- CreateIndex
CREATE INDEX "LoginAttemptLog_userId_success_timestamp_idx" ON "LoginAttemptLog"("userId", "success", "timestamp");

-- CreateIndex
CREATE INDEX "LoginAttemptLog_email_success_timestamp_idx" ON "LoginAttemptLog"("email", "success", "timestamp");

-- CreateIndex
CREATE INDEX "LoginAttemptLog_provider_success_timestamp_idx" ON "LoginAttemptLog"("provider", "success", "timestamp");

-- CreateIndex
CREATE INDEX "LoginAttemptLog_ipAddress_timestamp_idx" ON "LoginAttemptLog"("ipAddress", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentLog_orderedProductId_key" ON "PaymentLog"("orderedProductId");

-- CreateIndex
CREATE INDEX "PaymentLog_orderedProductId_idx" ON "PaymentLog"("orderedProductId");

-- CreateIndex
CREATE INDEX "PaymentLog_userId_status_idx" ON "PaymentLog"("userId", "status");

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
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_pollLogId_fkey" FOREIGN KEY ("pollLogId") REFERENCES "PollLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardsLog" ADD CONSTRAINT "RewardsLog_questLogId_fkey" FOREIGN KEY ("questLogId") REFERENCES "QuestLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttemptLog" ADD CONSTRAINT "LoginAttemptLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
