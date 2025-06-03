-- AlterTable
ALTER TABLE "BlockchainNetwork" ADD COLUMN     "isStoryNetwork" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "BlockchainNetwork_isStoryNetwork_idx" ON "BlockchainNetwork"("isStoryNetwork");

-- CreateIndex
CREATE INDEX "BlockchainNetwork_isTestnet_isActive_isStoryNetwork_idx" ON "BlockchainNetwork"("isTestnet", "isActive", "isStoryNetwork");
