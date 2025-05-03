-- CreateEnum
CREATE TYPE "PlayerAssetStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED', 'FROZEN');

-- AlterTable
ALTER TABLE "PlayerAsset" ADD COLUMN     "status" "PlayerAssetStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "PlayerAsset_status_idx" ON "PlayerAsset"("status");
