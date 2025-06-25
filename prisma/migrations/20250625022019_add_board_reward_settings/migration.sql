-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "allowAdminRewards" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowArtistRewards" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowTeamRewards" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowUserRewards" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dailyPostLimit" INTEGER,
ADD COLUMN     "maxRewardPerPost" INTEGER,
ADD COLUMN     "popularPostRewardAmount" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "popularPostRewardAssetId" TEXT,
ADD COLUMN     "popularPostRewardEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "popularPostThreshold" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "postCreationRewardAmount" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "postCreationRewardAssetId" TEXT,
ADD COLUMN     "postCreationRewardEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "qualityContentRewardAmount" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "qualityContentRewardAssetId" TEXT,
ADD COLUMN     "qualityContentRewardEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weeklyPostLimit" INTEGER;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_postCreationRewardAssetId_fkey" FOREIGN KEY ("postCreationRewardAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_popularPostRewardAssetId_fkey" FOREIGN KEY ("popularPostRewardAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_qualityContentRewardAssetId_fkey" FOREIGN KEY ("qualityContentRewardAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
