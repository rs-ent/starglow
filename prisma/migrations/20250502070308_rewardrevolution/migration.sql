/*
  Warnings:

  - You are about to drop the column `rewardCurrency` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `rewards` on the `Quest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "bettingAssetId" TEXT,
ADD COLUMN     "participationRewardAmount" INTEGER,
ADD COLUMN     "participationRewardAssetId" TEXT;

-- AlterTable
ALTER TABLE "Quest" DROP COLUMN "rewardCurrency",
DROP COLUMN "rewards",
ADD COLUMN     "rewardAmount" INTEGER,
ADD COLUMN     "rewardAssetId" TEXT;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_rewardAssetId_fkey" FOREIGN KEY ("rewardAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_bettingAssetId_fkey" FOREIGN KEY ("bettingAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_participationRewardAssetId_fkey" FOREIGN KEY ("participationRewardAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
