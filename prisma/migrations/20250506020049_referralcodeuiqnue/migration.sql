/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `Player` will be added. If there are existing duplicate values, this will fail.
  - Made the column `referralCode` on table `Player` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "referralCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Player_referralCode_key" ON "Player"("referralCode");
