-- CreateEnum
CREATE TYPE "AssetInstanceStatus" AS ENUM ('PENDING', 'RECEIVED', 'RECEIVED_EXPIRED', 'USED', 'EXPIRED', 'EXCHANGED', 'CANCELLED', 'DESTROYED');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "hasInstance" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AssetInstance" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "status" "AssetInstanceStatus" NOT NULL DEFAULT 'PENDING',
    "assetId" TEXT NOT NULL,
    "playerId" TEXT,
    "playerAssetId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "usedFor" TEXT,
    "usedLocation" TEXT,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssetInstance_assetId_idx" ON "AssetInstance"("assetId");

-- CreateIndex
CREATE INDEX "AssetInstance_playerId_idx" ON "AssetInstance"("playerId");

-- CreateIndex
CREATE INDEX "AssetInstance_status_idx" ON "AssetInstance"("status");

-- CreateIndex
CREATE INDEX "AssetInstance_serialNumber_idx" ON "AssetInstance"("serialNumber");

-- CreateIndex
CREATE INDEX "AssetInstance_assetId_playerId_idx" ON "AssetInstance"("assetId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetInstance_assetId_serialNumber_key" ON "AssetInstance"("assetId", "serialNumber");

-- AddForeignKey
ALTER TABLE "AssetInstance" ADD CONSTRAINT "AssetInstance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetInstance" ADD CONSTRAINT "AssetInstance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetInstance" ADD CONSTRAINT "AssetInstance_playerAssetId_fkey" FOREIGN KEY ("playerAssetId") REFERENCES "PlayerAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
