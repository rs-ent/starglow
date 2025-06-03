-- AlterTable
ALTER TABLE "ipfs" ADD COLUMN     "previewHeight" INTEGER,
ADD COLUMN     "previewMimeType" TEXT,
ADD COLUMN     "previewSizeBytes" INTEGER,
ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "previewWidth" INTEGER;

-- CreateIndex
CREATE INDEX "ipfs_previewUrl_idx" ON "ipfs"("previewUrl");
