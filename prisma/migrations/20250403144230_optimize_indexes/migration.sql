-- DropIndex
DROP INDEX "Account_userId_idx";

-- DropIndex
DROP INDEX "Events_category_idx";

-- DropIndex
DROP INDEX "Events_category_status_idx";

-- DropIndex
DROP INDEX "Events_endDate_idx";

-- DropIndex
DROP INDEX "Events_isActive_idx";

-- DropIndex
DROP INDEX "Events_isFeatured_idx";

-- DropIndex
DROP INDEX "Events_location_idx";

-- DropIndex
DROP INDEX "Events_price_idx";

-- DropIndex
DROP INDEX "Events_saleEndDate_idx";

-- DropIndex
DROP INDEX "Events_saleStartDate_idx";

-- DropIndex
DROP INDEX "Events_startDate_idx";

-- DropIndex
DROP INDEX "Events_status_idx";

-- DropIndex
DROP INDEX "Events_title_idx";

-- DropIndex
DROP INDEX "Player_userId_telegramId_id_idx";

-- DropIndex
DROP INDEX "Quest_permanent_visible_idx";

-- DropIndex
DROP INDEX "Quest_primary_idx";

-- DropIndex
DROP INDEX "Quest_startDate_idx";

-- DropIndex
DROP INDEX "QuestLog_playerId_completed_idx";

-- DropIndex
DROP INDEX "StoredFiles_url_sourceUrl_idx";

-- DropIndex
DROP INDEX "Wallet_userId_address_idx";

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

-- CreateIndex
CREATE INDEX "LoginAttemptLog_userId_success_timestamp_idx" ON "LoginAttemptLog"("userId", "success", "timestamp");

-- CreateIndex
CREATE INDEX "LoginAttemptLog_email_success_timestamp_idx" ON "LoginAttemptLog"("email", "success", "timestamp");

-- CreateIndex
CREATE INDEX "LoginAttemptLog_provider_success_timestamp_idx" ON "LoginAttemptLog"("provider", "success", "timestamp");

-- CreateIndex
CREATE INDEX "LoginAttemptLog_ipAddress_timestamp_idx" ON "LoginAttemptLog"("ipAddress", "timestamp");

-- CreateIndex
CREATE INDEX "Account_userId_provider_idx" ON "Account"("userId", "provider");

-- CreateIndex
CREATE INDEX "Events_category_status_startDate_idx" ON "Events"("category", "status", "startDate");

-- CreateIndex
CREATE INDEX "Events_location_startDate_idx" ON "Events"("location", "startDate");

-- CreateIndex
CREATE INDEX "Events_isFeatured_isActive_startDate_idx" ON "Events"("isFeatured", "isActive", "startDate");

-- CreateIndex
CREATE INDEX "Player_userId_telegramId_idx" ON "Player"("userId", "telegramId");

-- CreateIndex
CREATE INDEX "Player_points_SGP_SGT_idx" ON "Player"("points", "SGP", "SGT");

-- CreateIndex
CREATE INDEX "Player_recommenderId_idx" ON "Player"("recommenderId");

-- CreateIndex
CREATE INDEX "Poll_startDate_endDate_exposeInScheduleTab_idx" ON "Poll"("startDate", "endDate", "exposeInScheduleTab");

-- CreateIndex
CREATE INDEX "Poll_totalVotes_totalBetsAmount_idx" ON "Poll"("totalVotes", "totalBetsAmount");

-- CreateIndex
CREATE INDEX "PollLog_playerId_pollId_idx" ON "PollLog"("playerId", "pollId");

-- CreateIndex
CREATE INDEX "PollLog_pollId_option_idx" ON "PollLog"("pollId", "option");

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
CREATE INDEX "RewardsLog_playerId_currency_createdAt_idx" ON "RewardsLog"("playerId", "currency", "createdAt");

-- CreateIndex
CREATE INDEX "RewardsLog_questId_pollId_idx" ON "RewardsLog"("questId", "pollId");

-- CreateIndex
CREATE INDEX "Session_userId_expires_idx" ON "Session"("userId", "expires");

-- CreateIndex
CREATE INDEX "StoredFiles_bucket_purpose_idx" ON "StoredFiles"("bucket", "purpose");

-- CreateIndex
CREATE INDEX "StoredFiles_url_type_idx" ON "StoredFiles"("url", "type");

-- CreateIndex
CREATE INDEX "User_email_active_idx" ON "User"("email", "active");

-- CreateIndex
CREATE INDEX "User_role_active_idx" ON "User"("role", "active");

-- CreateIndex
CREATE INDEX "Wallet_userId_network_default_idx" ON "Wallet"("userId", "network", "default");

-- CreateIndex
CREATE INDEX "Wallet_address_network_idx" ON "Wallet"("address", "network");

-- AddForeignKey
ALTER TABLE "LoginAttemptLog" ADD CONSTRAINT "LoginAttemptLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Session_sessionToken_key" RENAME TO "Session_sessionToken_unique";
