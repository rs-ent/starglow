-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('URL', 'REFERRAL');

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "questType" "QuestType" NOT NULL DEFAULT 'URL';
