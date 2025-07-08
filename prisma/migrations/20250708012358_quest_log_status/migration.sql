-- CreateEnum
CREATE TYPE "QuestLogStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'RECLAIMABLE', 'CLAIMED', 'FAILED', 'DEPRECATED');

-- AlterTable
ALTER TABLE "QuestLog" ADD COLUMN     "status" "QuestLogStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "QuestLog_status_idx" ON "QuestLog"("status");
