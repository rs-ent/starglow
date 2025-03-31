-- AlterTable
ALTER TABLE "QuestLog" ADD COLUMN     "rewardCurrency" "RewardCurrency" NOT NULL DEFAULT 'points',
ADD COLUMN     "rewards" INTEGER NOT NULL DEFAULT 0;
