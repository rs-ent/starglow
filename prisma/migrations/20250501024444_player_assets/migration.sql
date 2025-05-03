/*
  Warnings:

  - You are about to drop the column `SGP` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `SGT` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `Player` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Player_points_SGP_SGT_idx";

-- AlterTable
ALTER TABLE "Player" DROP COLUMN "SGP",
DROP COLUMN "SGT",
DROP COLUMN "points";

-- CreateTable
CREATE TABLE "PlayerAsset" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerAsset_playerId_idx" ON "PlayerAsset"("playerId");

-- CreateIndex
CREATE INDEX "PlayerAsset_assetId_idx" ON "PlayerAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerAsset_playerId_assetId_key" ON "PlayerAsset"("playerId", "assetId");

-- AddForeignKey
ALTER TABLE "PlayerAsset" ADD CONSTRAINT "PlayerAsset_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAsset" ADD CONSTRAINT "PlayerAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
