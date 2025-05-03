-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('ONCHAIN', 'OFFCHAIN');

-- CreateTable
CREATE TABLE "Assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "metadata" JSONB,
    "assetType" "AssetType" NOT NULL,
    "contractAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "selectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "abis" JSONB,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "networkId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTransaction" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "result" TEXT,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assets_assetType_isActive_idx" ON "Assets"("assetType", "isActive");

-- CreateIndex
CREATE INDEX "Assets_contractAddress_idx" ON "Assets"("contractAddress");

-- CreateIndex
CREATE INDEX "Assets_networkId_idx" ON "Assets"("networkId");

-- CreateIndex
CREATE INDEX "AssetTransaction_assetId_success_idx" ON "AssetTransaction"("assetId", "success");

-- CreateIndex
CREATE INDEX "AssetTransaction_txHash_idx" ON "AssetTransaction"("txHash");

-- AddForeignKey
ALTER TABLE "Assets" ADD CONSTRAINT "Assets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "EscrowWallet"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assets" ADD CONSTRAINT "Assets_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "EscrowWallet"("address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assets" ADD CONSTRAINT "Assets_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;
