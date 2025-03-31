/*
  Warnings:

  - You are about to drop the column `gameMoney` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `raffleTickets` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `starPurchased` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `usedCashMoney` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `vipUntil` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `Completed` on the `QuestLog` table. All the data in the column will be lost.
  - You are about to drop the column `Currency` on the `QuestLog` table. All the data in the column will be lost.
  - You are about to drop the column `Price` on the `QuestLog` table. All the data in the column will be lost.
  - You are about to drop the column `Quest_Date` on the `QuestLog` table. All the data in the column will be lost.
  - You are about to drop the column `Quest_Title` on the `QuestLog` table. All the data in the column will be lost.
  - You are about to drop the column `Quest_Type` on the `QuestLog` table. All the data in the column will be lost.
  - You are about to drop the column `URL` on the `QuestLog` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `QuestLog` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `privateKey` on the `Wallet` table. All the data in the column will be lost.
  - The `primary` column on the `Wallet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Daily Quests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameMoneyLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OgImageCache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Polls` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[playerId,questId]` on the table `QuestLog` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `Player` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "RewardCurrency" AS ENUM ('Points', 'SGP', 'SGT');

-- DropForeignKey
ALTER TABLE "GameMoneyLog" DROP CONSTRAINT "GameMoneyLog_playerId_fkey";

-- DropForeignKey
ALTER TABLE "QuestLog" DROP CONSTRAINT "QuestLog_playerId_fkey";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "gameMoney",
DROP COLUMN "raffleTickets",
DROP COLUMN "starPurchased",
DROP COLUMN "usedCashMoney",
DROP COLUMN "vipUntil",
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "QuestLog" DROP COLUMN "Completed",
DROP COLUMN "Currency",
DROP COLUMN "Price",
DROP COLUMN "Quest_Date",
DROP COLUMN "Quest_Title",
DROP COLUMN "Quest_Type",
DROP COLUMN "URL",
DROP COLUMN "type",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "completedAt" DROP NOT NULL,
ALTER COLUMN "completedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "providerId";

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "privateKey",
ADD COLUMN     "default" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "primary",
ADD COLUMN     "primary" INTEGER DEFAULT 0;

-- DropTable
DROP TABLE "Daily Quests";

-- DropTable
DROP TABLE "GameMoneyLog";

-- DropTable
DROP TABLE "OgImageCache";

-- DropTable
DROP TABLE "Polls";

-- DropTable
DROP TABLE "VerificationToken";

-- DropEnum
DROP TYPE "CurrencyType";

-- DropEnum
DROP TYPE "QuestType";

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "rewards" INTEGER NOT NULL DEFAULT 800,
    "rewardCurrency" "RewardCurrency" NOT NULL DEFAULT 'Points',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "permanent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "PointsLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quest_startDate_endDate_permanent_idx" ON "Quest"("startDate", "endDate", "permanent");

-- CreateIndex
CREATE INDEX "Poll_id_startDate_endDate_exposeInScheduleTab_idx" ON "Poll"("id", "startDate", "endDate", "exposeInScheduleTab");

-- CreateIndex
CREATE INDEX "PollLog_playerId_pollId_option_idx" ON "PollLog"("playerId", "pollId", "option");

-- CreateIndex
CREATE UNIQUE INDEX "PollLog_playerId_pollId_key" ON "PollLog"("playerId", "pollId");

-- CreateIndex
CREATE INDEX "PointsLog_playerId_createdAt_idx" ON "PointsLog"("playerId", "createdAt");

-- CreateIndex
CREATE INDEX "Player_userId_telegramId_idx" ON "Player"("userId", "telegramId");

-- CreateIndex
CREATE INDEX "QuestLog_playerId_questId_completed_idx" ON "QuestLog"("playerId", "questId", "completed");

-- CreateIndex
CREATE UNIQUE INDEX "QuestLog_playerId_questId_key" ON "QuestLog"("playerId", "questId");

-- CreateIndex
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");

-- CreateIndex
CREATE INDEX "Wallet_userId_address_idx" ON "Wallet"("userId", "address");

-- AddForeignKey
ALTER TABLE "QuestLog" ADD CONSTRAINT "QuestLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestLog" ADD CONSTRAINT "QuestLog_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollLog" ADD CONSTRAINT "PollLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollLog" ADD CONSTRAINT "PollLog_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLog" ADD CONSTRAINT "PointsLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
