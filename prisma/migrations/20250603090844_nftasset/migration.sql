-- CreateTable
CREATE TABLE "Story_nft" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "tokenURI" TEXT,
    "mintTxHash" TEXT,
    "ipAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_nft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story_ipAsset" (
    "id" TEXT NOT NULL,
    "ipId" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "tokenContract" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "ipMetadataURI" TEXT,
    "ipMetadataHash" TEXT,
    "nftMetadataURI" TEXT,
    "nftMetadataHash" TEXT,
    "registrationTxHash" TEXT,
    "licenseTermsId" TEXT,
    "licenseTermsURI" TEXT,
    "networkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_ipAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Story_nft_contractAddress_idx" ON "Story_nft"("contractAddress");

-- CreateIndex
CREATE INDEX "Story_nft_ownerAddress_idx" ON "Story_nft"("ownerAddress");

-- CreateIndex
CREATE INDEX "Story_nft_networkId_idx" ON "Story_nft"("networkId");

-- CreateIndex
CREATE INDEX "Story_nft_ipAssetId_idx" ON "Story_nft"("ipAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "Story_nft_contractAddress_tokenId_key" ON "Story_nft"("contractAddress", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Story_ipAsset_ipId_key" ON "Story_ipAsset"("ipId");

-- CreateIndex
CREATE INDEX "Story_ipAsset_ipId_idx" ON "Story_ipAsset"("ipId");

-- CreateIndex
CREATE INDEX "Story_ipAsset_networkId_idx" ON "Story_ipAsset"("networkId");

-- CreateIndex
CREATE UNIQUE INDEX "Story_ipAsset_chainId_tokenContract_tokenId_key" ON "Story_ipAsset"("chainId", "tokenContract", "tokenId");

-- AddForeignKey
ALTER TABLE "Story_nft" ADD CONSTRAINT "Story_nft_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story_nft" ADD CONSTRAINT "Story_nft_contractAddress_fkey" FOREIGN KEY ("contractAddress") REFERENCES "Story_spg"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story_nft" ADD CONSTRAINT "Story_nft_ipAssetId_fkey" FOREIGN KEY ("ipAssetId") REFERENCES "Story_ipAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story_ipAsset" ADD CONSTRAINT "Story_ipAsset_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
