/*
  Warnings:

  - You are about to drop the `Artist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ArtistMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CollectionContract` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Metadata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NFT` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NFTEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ArtistMember" DROP CONSTRAINT "ArtistMember_artistId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionContract" DROP CONSTRAINT "CollectionContract_artistId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionContract" DROP CONSTRAINT "CollectionContract_factoryId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionContract" DROP CONSTRAINT "CollectionContract_networkId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_collectionContractId_fkey";

-- DropForeignKey
ALTER TABLE "Metadata" DROP CONSTRAINT "Metadata_ipfsFileId_fkey";

-- DropForeignKey
ALTER TABLE "NFT" DROP CONSTRAINT "NFT_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "NFT" DROP CONSTRAINT "NFT_metadataId_fkey";

-- DropForeignKey
ALTER TABLE "NFT" DROP CONSTRAINT "NFT_networkId_fkey";

-- DropForeignKey
ALTER TABLE "NFTEvent" DROP CONSTRAINT "NFTEvent_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "NFTEvent" DROP CONSTRAINT "NFTEvent_nftId_fkey";

-- DropTable
DROP TABLE "Artist";

-- DropTable
DROP TABLE "ArtistMember";

-- DropTable
DROP TABLE "CollectionContract";

-- DropTable
DROP TABLE "Metadata";

-- DropTable
DROP TABLE "NFT";

-- DropTable
DROP TABLE "NFTEvent";
