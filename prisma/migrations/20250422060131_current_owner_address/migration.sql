-- AlterTable
ALTER TABLE "NFT" ADD COLUMN     "currentOwnerAddress" TEXT;

-- CreateIndex
CREATE INDEX "NFT_tokenId_idx" ON "NFT"("tokenId");

-- CreateIndex
CREATE INDEX "NFT_currentOwnerAddress_idx" ON "NFT"("currentOwnerAddress");
