/*
  Warnings:

  - A unique constraint covering the columns `[collectionId,tokenId]` on the table `NFT` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "NFT_collectionId_tokenId_idx" ON "NFT"("collectionId", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "NFT_collectionId_tokenId_key" ON "NFT"("collectionId", "tokenId");
