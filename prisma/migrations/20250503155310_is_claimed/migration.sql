-- AlterTable
ALTER TABLE "QuestLog" ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "isClaimed" BOOLEAN NOT NULL DEFAULT false;
