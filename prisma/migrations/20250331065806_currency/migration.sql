-- AlterTable
ALTER TABLE "Daily Quests" ADD COLUMN     "Currency" TEXT DEFAULT 'Points',
ADD COLUMN     "Price" INTEGER DEFAULT 800;

-- AlterTable
ALTER TABLE "MissionLog" ADD COLUMN     "Currency" TEXT,
ADD COLUMN     "Price" INTEGER;
