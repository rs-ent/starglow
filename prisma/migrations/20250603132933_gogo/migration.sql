/*
  Warnings:

  - You are about to drop the column `ipAssetId` on the `Story_nft` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Story_nft" DROP CONSTRAINT "Story_nft_ipAssetId_fkey";

-- DropIndex
DROP INDEX "Story_nft_ipAssetId_idx";

-- AlterTable
ALTER TABLE "Story_nft" DROP COLUMN "ipAssetId",
ADD COLUMN     "ipId" TEXT;

-- CreateIndex
CREATE INDEX "Story_nft_ipId_idx" ON "Story_nft"("ipId");

-- AddForeignKey
ALTER TABLE "Story_nft" ADD CONSTRAINT "Story_nft_ipId_fkey" FOREIGN KEY ("ipId") REFERENCES "Story_ipAsset"("ipId") ON DELETE SET NULL ON UPDATE CASCADE;
