/*
  Warnings:

  - A unique constraint covering the columns `[assetId,code]` on the table `AssetInstance` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "AssetInstance" DROP CONSTRAINT "AssetInstance_playerAssetId_fkey";

-- AlterTable
ALTER TABLE "AssetInstance" ADD COLUMN     "code" TEXT,
ALTER COLUMN "playerAssetId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AssetInstance_assetId_code_key" ON "AssetInstance"("assetId", "code");

-- AddForeignKey
ALTER TABLE "AssetInstance" ADD CONSTRAINT "AssetInstance_playerAssetId_fkey" FOREIGN KEY ("playerAssetId") REFERENCES "PlayerAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
