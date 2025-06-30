-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BETTING_SUCCESS', 'BETTING_FAILED', 'POLL_BETTING_WIN', 'POLL_BETTING_LOSE', 'POLL_BETTING_PAYOUT', 'POLL_BETTING_REFUND', 'POLL_STARTED', 'POLL_ENDING_SOON', 'POLL_ENDED', 'POLL_RESULT_ANNOUNCED', 'POLL_PARTICIPATION_REWARD', 'QUEST_AVAILABLE', 'QUEST_REMINDER', 'QUEST_COMPLETED', 'QUEST_REWARD_RECEIVED', 'QUEST_EXPIRING_SOON', 'RAFFLE_NEW', 'RAFFLE_ENTRY_CONFIRMED', 'RAFFLE_DRAWING_SOON', 'RAFFLE_RESULT_AVAILABLE', 'RAFFLE_WIN', 'RAFFLE_PRIZE_DISTRIBUTED', 'BOARD_POST_COMMENT', 'BOARD_POST_REACTION', 'BOARD_COMMENT_REPLY', 'BOARD_POST_REWARD', 'BOARD_MENTION', 'ARTIST_NEW_FEED', 'ARTIST_NEW_MESSAGE', 'ARTIST_LIVE_EVENT', 'ARTIST_SPECIAL_CONTENT', 'ASSET_RECEIVED', 'ASSET_SENT', 'ASSET_STAKING_REWARD', 'ASSET_BALANCE_LOW', 'NFT_MINTED', 'NFT_TRANSFERRED', 'NFT_STAKING_REWARD', 'NFT_COLLECTION_NEW', 'REFERRAL_JOINED', 'REFERRAL_REWARD', 'ACHIEVEMENT_UNLOCKED', 'LEVEL_UP', 'SYSTEM_MAINTENANCE', 'SYSTEM_UPDATE', 'ACCOUNT_SECURITY', 'TERMS_UPDATED', 'PROMOTIONAL', 'EVENT_STARTED', 'EVENT_ENDING_SOON', 'EVENT_REWARD', 'GENERAL_INFO', 'WELCOME', 'BIRTHDAY');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('BETTING', 'POLLS', 'QUESTS', 'RAFFLES', 'SOCIAL', 'ASSETS', 'NFTS', 'ARTISTS', 'BOARDS', 'EVENTS', 'SYSTEM', 'GENERAL');

-- CreateEnum
CREATE TYPE "NotificationActionType" AS ENUM ('NONE', 'OPEN_APP', 'OPEN_URL', 'OPEN_POLL', 'OPEN_QUEST', 'OPEN_RAFFLE', 'OPEN_BOARD_POST', 'OPEN_ARTIST_FEED', 'OPEN_WALLET', 'OPEN_NFT_COLLECTION', 'OPEN_SETTINGS', 'CLAIM_REWARD', 'PARTICIPATE_POLL', 'PARTICIPATE_RAFFLE', 'VIEW_RESULT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "description" TEXT,
    "actionType" "NotificationActionType" NOT NULL DEFAULT 'NONE',
    "actionUrl" TEXT,
    "actionData" JSONB,
    "entityType" TEXT,
    "entityId" TEXT,
    "entityData" JSONB,
    "betAmount" DOUBLE PRECISION,
    "winAmount" DOUBLE PRECISION,
    "rewardAmount" DOUBLE PRECISION,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "sentChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failedChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "iconUrl" TEXT,
    "imageUrl" TEXT,
    "badgeCount" INTEGER DEFAULT 0,
    "showBadge" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "discordEnabled" BOOLEAN NOT NULL DEFAULT false,
    "bettingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "bettingSuccessEnabled" BOOLEAN NOT NULL DEFAULT true,
    "bettingResultEnabled" BOOLEAN NOT NULL DEFAULT true,
    "bettingPayoutEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pollEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pollEndingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pollResultEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pollNewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "questEnabled" BOOLEAN NOT NULL DEFAULT true,
    "questCompleteEnabled" BOOLEAN NOT NULL DEFAULT true,
    "questRewardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "questNewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "raffleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "raffleResultEnabled" BOOLEAN NOT NULL DEFAULT true,
    "raffleNewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "boardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "boardCommentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "boardReactionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "boardRewardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "artistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "artistFeedEnabled" BOOLEAN NOT NULL DEFAULT true,
    "artistMessageEnabled" BOOLEAN NOT NULL DEFAULT true,
    "assetEnabled" BOOLEAN NOT NULL DEFAULT true,
    "assetRewardEnabled" BOOLEAN NOT NULL DEFAULT true,
    "assetTransferEnabled" BOOLEAN NOT NULL DEFAULT false,
    "nftEnabled" BOOLEAN NOT NULL DEFAULT true,
    "nftMintEnabled" BOOLEAN NOT NULL DEFAULT true,
    "nftTransferEnabled" BOOLEAN NOT NULL DEFAULT false,
    "socialEnabled" BOOLEAN NOT NULL DEFAULT true,
    "referralEnabled" BOOLEAN NOT NULL DEFAULT true,
    "followEnabled" BOOLEAN NOT NULL DEFAULT true,
    "systemEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "securityEnabled" BOOLEAN NOT NULL DEFAULT true,
    "doNotDisturbEnabled" BOOLEAN NOT NULL DEFAULT false,
    "doNotDisturbStart" TEXT,
    "doNotDisturbEnd" TEXT,
    "doNotDisturbDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxDailyNotifications" INTEGER DEFAULT 50,
    "maxHourlyNotifications" INTEGER DEFAULT 10,
    "enableDigestMode" BOOLEAN NOT NULL DEFAULT false,
    "digestFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalRead" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "inAppSent" INTEGER NOT NULL DEFAULT 0,
    "pushSent" INTEGER NOT NULL DEFAULT 0,
    "emailSent" INTEGER NOT NULL DEFAULT 0,
    "telegramSent" INTEGER NOT NULL DEFAULT 0,
    "bettingCount" INTEGER NOT NULL DEFAULT 0,
    "pollCount" INTEGER NOT NULL DEFAULT 0,
    "questCount" INTEGER NOT NULL DEFAULT 0,
    "raffleCount" INTEGER NOT NULL DEFAULT 0,
    "socialCount" INTEGER NOT NULL DEFAULT 0,
    "systemCount" INTEGER NOT NULL DEFAULT 0,
    "openRate" DOUBLE PRECISION,
    "clickRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_notifications_playerId_isRead_createdAt_idx" ON "user_notifications"("playerId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "user_notifications_playerId_type_createdAt_idx" ON "user_notifications"("playerId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "user_notifications_playerId_category_createdAt_idx" ON "user_notifications"("playerId", "category", "createdAt");

-- CreateIndex
CREATE INDEX "user_notifications_type_status_createdAt_idx" ON "user_notifications"("type", "status", "createdAt");

-- CreateIndex
CREATE INDEX "user_notifications_scheduledAt_status_idx" ON "user_notifications"("scheduledAt", "status");

-- CreateIndex
CREATE INDEX "user_notifications_expiresAt_idx" ON "user_notifications"("expiresAt");

-- CreateIndex
CREATE INDEX "user_notifications_entityType_entityId_idx" ON "user_notifications"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "user_notifications_entityType_type_idx" ON "user_notifications"("entityType", "type");

-- CreateIndex
CREATE INDEX "user_notifications_playerId_entityType_createdAt_idx" ON "user_notifications"("playerId", "entityType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_playerId_key" ON "notification_settings"("playerId");

-- CreateIndex
CREATE INDEX "notification_stats_date_idx" ON "notification_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "notification_stats_date_key" ON "notification_stats"("date");

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
