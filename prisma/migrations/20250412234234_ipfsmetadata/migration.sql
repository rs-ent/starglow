-- CreateTable
CREATE TABLE "IpfsMetadata" (
    "id" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "ipfsUrl" TEXT NOT NULL,
    "gatewayUrl" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'nft-metadata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastFetched" TIMESTAMP(3),

    CONSTRAINT "IpfsMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IpfsMetadata_cid_key" ON "IpfsMetadata"("cid");

-- CreateIndex
CREATE INDEX "IpfsMetadata_cid_type_idx" ON "IpfsMetadata"("cid", "type");

-- CreateIndex
CREATE INDEX "IpfsMetadata_type_createdAt_idx" ON "IpfsMetadata"("type", "createdAt");
