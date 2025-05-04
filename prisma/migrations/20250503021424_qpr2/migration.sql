-- AddForeignKey
ALTER TABLE "QuestLog" ADD CONSTRAINT "QuestLog_rewardAssetId_fkey" FOREIGN KEY ("rewardAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollLog" ADD CONSTRAINT "PollLog_rewardAssetId_fkey" FOREIGN KEY ("rewardAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
