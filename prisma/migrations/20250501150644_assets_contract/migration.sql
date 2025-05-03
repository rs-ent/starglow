/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Asset` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Asset" DROP CONSTRAINT "Asset_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Asset" DROP CONSTRAINT "Asset_updatedBy_fkey";

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy",
ADD COLUMN     "assetsContractId" TEXT,
ADD COLUMN     "creatorAddress" TEXT;

-- CreateTable
CREATE TABLE "AssetsContract" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "abi" JSONB,
    "bytecode" TEXT,
    "networkId" TEXT NOT NULL,
    "creatorAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetsContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssetsContract_address_key" ON "AssetsContract"("address");

-- CreateIndex
CREATE INDEX "AssetsContract_networkId_idx" ON "AssetsContract"("networkId");

-- AddForeignKey
ALTER TABLE "AssetsContract" ADD CONSTRAINT "AssetsContract_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_assetsContractId_fkey" FOREIGN KEY ("assetsContractId") REFERENCES "AssetsContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
