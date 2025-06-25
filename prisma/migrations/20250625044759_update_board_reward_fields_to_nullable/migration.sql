-- AlterTable
ALTER TABLE "Board" ALTER COLUMN "allowAdminRewards" SET DEFAULT false,
ALTER COLUMN "allowArtistRewards" SET DEFAULT false,
ALTER COLUMN "allowTeamRewards" SET DEFAULT false,
ALTER COLUMN "popularPostRewardAmount" DROP NOT NULL,
ALTER COLUMN "popularPostRewardAmount" DROP DEFAULT,
ALTER COLUMN "popularPostRewardEnabled" SET DEFAULT false,
ALTER COLUMN "popularPostThreshold" DROP NOT NULL,
ALTER COLUMN "popularPostThreshold" DROP DEFAULT,
ALTER COLUMN "postCreationRewardAmount" DROP NOT NULL,
ALTER COLUMN "postCreationRewardAmount" DROP DEFAULT,
ALTER COLUMN "postCreationRewardEnabled" SET DEFAULT false,
ALTER COLUMN "qualityContentRewardAmount" DROP NOT NULL,
ALTER COLUMN "qualityContentRewardAmount" DROP DEFAULT;
