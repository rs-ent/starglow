-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "needTutorial" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AssetTutorial" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "steps" JSONB NOT NULL,

    CONSTRAINT "AssetTutorial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssetTutorial_assetId_key" ON "AssetTutorial"("assetId");

-- CreateIndex
CREATE INDEX "AssetTutorial_assetId_idx" ON "AssetTutorial"("assetId");

-- AddForeignKey
ALTER TABLE "AssetTutorial" ADD CONSTRAINT "AssetTutorial_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
