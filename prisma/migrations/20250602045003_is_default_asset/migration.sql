-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Asset_isDefault_idx" ON "Asset"("isDefault");
