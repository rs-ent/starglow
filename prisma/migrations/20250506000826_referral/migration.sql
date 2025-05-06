/*
  Warnings:

  - You are about to drop the column `recommendedCount` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `recommenderId` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `recommenderMethod` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `recommenderName` on the `Player` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Player_recommenderId_idx";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "recommendedCount",
DROP COLUMN "recommenderId",
DROP COLUMN "recommenderMethod",
DROP COLUMN "recommenderName",
ADD COLUMN     "referralCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "referredBy" TEXT;

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "isReferral" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referralCount" INTEGER;

-- CreateTable
CREATE TABLE "ReferralLog" (
    "id" TEXT NOT NULL,
    "referredPlayerId" TEXT NOT NULL,
    "referrerPlayerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralLog_referredPlayerId_referrerPlayerId_key" ON "ReferralLog"("referredPlayerId", "referrerPlayerId");

-- CreateIndex
CREATE INDEX "Player_referredBy_idx" ON "Player"("referredBy");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLog" ADD CONSTRAINT "ReferralLog_referredPlayerId_fkey" FOREIGN KEY ("referredPlayerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLog" ADD CONSTRAINT "ReferralLog_referrerPlayerId_fkey" FOREIGN KEY ("referrerPlayerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
