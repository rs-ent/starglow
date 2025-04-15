-- AlterTable
ALTER TABLE "IpfsFile" ADD COLUMN     "url" TEXT NOT NULL DEFAULT 'ipfs://';

-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN     "url" TEXT NOT NULL DEFAULT 'ipfs://';

-- CreateIndex
CREATE INDEX "IpfsFile_url_idx" ON "IpfsFile"("url");
