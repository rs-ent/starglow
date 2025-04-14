-- CreateTable
CREATE TABLE "Metadata" (
    "id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "ipfsFileId" TEXT NOT NULL,
    "collectionContractId" TEXT,
    "nftId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_ipfsFileId_key" ON "Metadata"("ipfsFileId");

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_nftId_key" ON "Metadata"("nftId");

-- CreateIndex
CREATE INDEX "Metadata_collectionContractId_idx" ON "Metadata"("collectionContractId");

-- CreateIndex
CREATE INDEX "Metadata_ipfsFileId_idx" ON "Metadata"("ipfsFileId");

-- CreateIndex
CREATE INDEX "Metadata_createdAt_idx" ON "Metadata"("createdAt");

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_ipfsFileId_fkey" FOREIGN KEY ("ipfsFileId") REFERENCES "IpfsFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_collectionContractId_fkey" FOREIGN KEY ("collectionContractId") REFERENCES "CollectionContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE SET NULL ON UPDATE CASCADE;
