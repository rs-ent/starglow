/*
  Warnings:

  - You are about to drop the `MissionLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MissionLog" DROP CONSTRAINT "MissionLog_playerId_fkey";

-- DropTable
DROP TABLE "MissionLog";

-- CreateTable
CREATE TABLE "QuestLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "type" "QuestType" NOT NULL,
    "Quest_Title" TEXT,
    "Quest_Date" TEXT,
    "Quest_Type" TEXT,
    "URL" TEXT,
    "Price" INTEGER,
    "Currency" TEXT,
    "Completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuestLog" ADD CONSTRAINT "QuestLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
