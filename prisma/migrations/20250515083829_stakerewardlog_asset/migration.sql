/*
  Warnings:

  - Added the required column `assetId` to the `StakeRewardLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StakeRewardLog" ADD COLUMN     "assetId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "StakeRewardLog" ADD CONSTRAINT "StakeRewardLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
