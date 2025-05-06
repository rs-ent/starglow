/*
  Warnings:

  - A unique constraint covering the columns `[userId,telegramId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "referralCode" TEXT;

-- CreateIndex
CREATE INDEX "Player_referralCode_idx" ON "Player"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_telegramId_key" ON "Player"("userId", "telegramId");
