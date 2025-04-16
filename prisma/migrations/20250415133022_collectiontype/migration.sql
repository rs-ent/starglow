-- CreateEnum
CREATE TYPE "MetadataType" AS ENUM ('collection', 'nft');

-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN     "type" "MetadataType" NOT NULL DEFAULT 'collection';
