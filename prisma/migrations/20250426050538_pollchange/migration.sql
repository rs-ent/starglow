/*
  Warnings:

  - You are about to drop the column `bannerImg` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `openPromotionImg` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `openPromotionText` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `optionsShorten` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `resultPromotionImg` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `resultPromotionText` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `results` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `totalBetsAmountByOption` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `totalVotesByOption` on the `Poll` table. All the data in the column will be lost.
  - Changed the type of `options` on the `Poll` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `optionId` to the `PollLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'ENDED', 'CANCELLED', 'CALCULATING_RESULTS');

-- CreateEnum
CREATE TYPE "PollCategory" AS ENUM ('GENERAL', 'NFT');

-- DropIndex
DROP INDEX "Poll_startDate_endDate_exposeInScheduleTab_idx";

-- DropIndex
DROP INDEX "Poll_totalVotes_totalBetsAmount_idx";

-- DropIndex
DROP INDEX "PollLog_pollId_option_idx";

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "bannerImg",
DROP COLUMN "openPromotionImg",
DROP COLUMN "openPromotionText",
DROP COLUMN "optionsShorten",
DROP COLUMN "resultPromotionImg",
DROP COLUMN "resultPromotionText",
DROP COLUMN "results",
DROP COLUMN "totalBetsAmountByOption",
DROP COLUMN "totalVotesByOption",
ADD COLUMN     "allowMultipleVote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bettingMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "category" "PollCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "customResults" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "hideResults" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imgUrl" TEXT,
ADD COLUMN     "maximumBet" INTEGER NOT NULL DEFAULT 10000,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "minimumBet" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "minimumPoints" INTEGER,
ADD COLUMN     "minimumSGP" INTEGER,
ADD COLUMN     "minimumSGT" INTEGER,
ADD COLUMN     "needToken" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "needTokenAddress" TEXT,
ADD COLUMN     "optionsOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "participationRewards" INTEGER,
ADD COLUMN     "postPromoImg" TEXT,
ADD COLUMN     "postPromoText" TEXT,
ADD COLUMN     "prePromoImg" TEXT,
ADD COLUMN     "prePromoText" TEXT,
ADD COLUMN     "requiredQuests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "resultVisibleDate" TIMESTAMP(3),
ADD COLUMN     "rewardCurrency" "RewardCurrency" NOT NULL DEFAULT 'points',
ADD COLUMN     "status" "PollStatus" NOT NULL DEFAULT 'UPCOMING',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "uniqueVoters" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationHash" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "voteLimit" INTEGER,
ADD COLUMN     "winnerRewards" INTEGER,
ADD COLUMN     "youtubeUrl" TEXT,
DROP COLUMN "options",
ADD COLUMN     "options" JSONB NOT NULL,
ALTER COLUMN "endDate" DROP DEFAULT,
ALTER COLUMN "exposeInScheduleTab" SET DEFAULT true;

-- AlterTable
ALTER TABLE "PollLog" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "optionId" TEXT NOT NULL,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "Poll_status_startDate_endDate_idx" ON "Poll"("status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Poll_category_status_idx" ON "Poll"("category", "status");

-- CreateIndex
CREATE INDEX "Poll_needToken_status_idx" ON "Poll"("needToken", "status");

-- CreateIndex
CREATE INDEX "Poll_bettingMode_status_idx" ON "Poll"("bettingMode", "status");

-- CreateIndex
CREATE INDEX "PollLog_pollId_optionId_idx" ON "PollLog"("pollId", "optionId");

-- CreateIndex
CREATE INDEX "PollLog_createdAt_idx" ON "PollLog"("createdAt");
