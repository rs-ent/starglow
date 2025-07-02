-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "answerAnnouncementDate" TIMESTAMP(3),
ADD COLUMN     "hasAnswerAnnouncement" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "participationConsumeAmount" INTEGER,
ADD COLUMN     "participationConsumeAssetId" TEXT,
ADD COLUMN     "showOnPollPage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showOnStarPage" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_participationConsumeAssetId_fkey" FOREIGN KEY ("participationConsumeAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
