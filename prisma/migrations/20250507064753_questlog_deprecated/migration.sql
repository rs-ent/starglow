-- AlterTable
ALTER TABLE "QuestLog" ADD COLUMN     "deprecated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ReferralLog_referrerPlayerId_idx" ON "ReferralLog"("referrerPlayerId");
