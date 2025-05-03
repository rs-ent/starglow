/*
  Warnings:

  - You are about to drop the `Assets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Assets" DROP CONSTRAINT "Assets_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Assets" DROP CONSTRAINT "Assets_networkId_fkey";

-- DropForeignKey
ALTER TABLE "Assets" DROP CONSTRAINT "Assets_updatedBy_fkey";

-- DropTable
DROP TABLE "Assets";

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "imageUrl" TEXT,
    "metadata" JSONB,
    "assetType" "AssetType" NOT NULL,
    "contractAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "selectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "abis" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "networkId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_assetType_isActive_idx" ON "Asset"("assetType", "isActive");

-- CreateIndex
CREATE INDEX "Asset_contractAddress_idx" ON "Asset"("contractAddress");

-- CreateIndex
CREATE INDEX "Asset_networkId_idx" ON "Asset"("networkId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "EscrowWallet"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "EscrowWallet"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;
