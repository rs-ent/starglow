-- DropIndex
DROP INDEX "CollectionContract_createdBy_createdAt_idx";

-- DropIndex
DROP INDEX "ExchangeRate_createdAt_idx";

-- DropIndex
DROP INDEX "Metadata_createdAt_idx";

-- DropIndex
DROP INDEX "NFT_tokenId_collectionId_key";

-- DropIndex
DROP INDEX "NFT_tokenId_idx";

-- DropIndex
DROP INDEX "VirtualAccount_expiresAt_idx";

-- AlterTable
ALTER TABLE "CollectionContract" ADD COLUMN     "isListed" BOOLEAN NOT NULL DEFAULT false;
