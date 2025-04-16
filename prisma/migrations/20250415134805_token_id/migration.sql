/*
  Warnings:

  - A unique constraint covering the columns `[collectionAddress,tokenId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN     "tokenId" INTEGER;

-- CreateIndex
CREATE INDEX "Metadata_collectionAddress_tokenId_idx" ON "Metadata"("collectionAddress", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_collectionAddress_tokenId_key" ON "Metadata"("collectionAddress", "tokenId");
