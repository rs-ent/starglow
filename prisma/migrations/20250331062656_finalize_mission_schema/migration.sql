-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('Daily', 'General');

-- CreateTable
CREATE TABLE "MissionLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "type" "QuestType" NOT NULL,
    "Quest_Title" TEXT,
    "Quest_Date" TEXT,
    "Quest_Type" TEXT,
    "URL" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MissionLog" ADD CONSTRAINT "MissionLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
