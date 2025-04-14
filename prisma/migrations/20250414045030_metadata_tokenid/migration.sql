/*
  Warnings:

  - You are about to drop the column `nftId` on the `Metadata` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[metadataId]` on the table `NFT` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_nftId_fkey";

-- DropIndex
DROP INDEX "Metadata_nftId_key";

-- AlterTable
ALTER TABLE "Metadata" DROP COLUMN "nftId";

-- AlterTable
ALTER TABLE "NFT" ADD COLUMN     "metadataId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "NFT_metadataId_key" ON "NFT"("metadataId");

-- AddForeignKey
ALTER TABLE "NFT" ADD CONSTRAINT "NFT_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "Metadata"("id") ON DELETE SET NULL ON UPDATE CASCADE;
