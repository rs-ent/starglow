-- AlterTable
ALTER TABLE "QuestLog" ALTER COLUMN "completedAt" DROP NOT NULL,
ALTER COLUMN "completedAt" DROP DEFAULT;
