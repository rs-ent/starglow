-- CreateTable
CREATE TABLE "Metadata" (
    "id" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "url" TEXT NOT NULL DEFAULT 'ipfs://',
    "collectionAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionContract" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "maxSupply" INTEGER NOT NULL,
    "mintPrice" TEXT NOT NULL,
    "baseURI" TEXT NOT NULL,
    "contractURI" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'admin',
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "circulation" INTEGER NOT NULL DEFAULT 1000,
    "mintedCount" INTEGER NOT NULL DEFAULT 0,
    "artistId" TEXT,

    CONSTRAINT "CollectionContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFT" (
    "id" TEXT NOT NULL,
    "tokenId" INTEGER NOT NULL,
    "collectionId" TEXT NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "metadataUri" TEXT,
    "mintedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "attributes" JSONB,
    "isListed" BOOLEAN NOT NULL DEFAULT false,
    "listingPrice" TEXT,
    "lastTransferredAt" TIMESTAMP(3),
    "transferCount" INTEGER NOT NULL DEFAULT 0,
    "isBurned" BOOLEAN NOT NULL DEFAULT false,
    "rarity" DOUBLE PRECISION,
    "tags" TEXT[],
    "category" TEXT,
    "creatorInfo" TEXT,
    "externalUrl" TEXT,
    "mintPrice" TEXT,
    "mintedBy" TEXT,
    "royaltyInfo" JSONB,

    CONSTRAINT "NFT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NFTEvent" (
    "id" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "price" TEXT,
    "transactionHash" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockNumber" INTEGER,

    CONSTRAINT "NFTEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "externalUrl" TEXT,
    "reportUrl" TEXT,
    "company" TEXT,
    "sns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "music" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "additionalInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistMember" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "imageUrl" TEXT,
    "externalUrl" TEXT,
    "description" TEXT,
    "realName" TEXT,
    "birthDate" TIMESTAMP(3),
    "birthPlace" TEXT,
    "nationality" TEXT,
    "height" INTEGER,
    "weight" INTEGER,
    "bloodType" TEXT,
    "constellation" TEXT,
    "sns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "music" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "additionalInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Metadata_collectionAddress_key" ON "Metadata"("collectionAddress");

-- CreateIndex
CREATE INDEX "Metadata_collectionAddress_idx" ON "Metadata"("collectionAddress");

-- CreateIndex
CREATE INDEX "Metadata_url_idx" ON "Metadata"("url");

-- CreateIndex
CREATE INDEX "Metadata_createdAt_idx" ON "Metadata"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionContract_address_key" ON "CollectionContract"("address");

-- CreateIndex
CREATE INDEX "CollectionContract_address_networkId_idx" ON "CollectionContract"("address", "networkId");

-- CreateIndex
CREATE INDEX "CollectionContract_factoryId_idx" ON "CollectionContract"("factoryId");

-- CreateIndex
CREATE INDEX "CollectionContract_createdBy_createdAt_idx" ON "CollectionContract"("createdBy", "createdAt");

-- CreateIndex
CREATE INDEX "NFT_ownerAddress_idx" ON "NFT"("ownerAddress");

-- CreateIndex
CREATE INDEX "NFT_tokenId_idx" ON "NFT"("tokenId");

-- CreateIndex
CREATE INDEX "NFT_collectionId_idx" ON "NFT"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "NFT_tokenId_collectionId_key" ON "NFT"("tokenId", "collectionId");

-- CreateIndex
CREATE INDEX "NFTEvent_nftId_idx" ON "NFTEvent"("nftId");

-- CreateIndex
CREATE INDEX "NFTEvent_eventType_idx" ON "NFTEvent"("eventType");

-- CreateIndex
CREATE INDEX "NFTEvent_fromAddress_toAddress_idx" ON "NFTEvent"("fromAddress", "toAddress");

-- CreateIndex
CREATE INDEX "Artist_name_idx" ON "Artist"("name");

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_collectionAddress_fkey" FOREIGN KEY ("collectionAddress") REFERENCES "CollectionContract"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionContract" ADD CONSTRAINT "CollectionContract_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "FactoryContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionContract" ADD CONSTRAINT "CollectionContract_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionContract" ADD CONSTRAINT "CollectionContract_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFT" ADD CONSTRAINT "NFT_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "CollectionContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFT" ADD CONSTRAINT "NFT_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFTEvent" ADD CONSTRAINT "NFTEvent_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NFTEvent" ADD CONSTRAINT "NFTEvent_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "CollectionContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistMember" ADD CONSTRAINT "ArtistMember_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
