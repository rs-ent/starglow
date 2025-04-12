-- CreateTable
CREATE TABLE "BlockchainNetwork" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "rpcUrl" TEXT NOT NULL,
    "explorerUrl" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "isTestnet" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockchainNetwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactoryContract" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deployedBy" TEXT,
    "transactionHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "collections" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "FactoryContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscrowWallet" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "privateKey" TEXT,
    "keyHash" TEXT,
    "networkIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "balance" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainNetwork_name_key" ON "BlockchainNetwork"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainNetwork_chainId_key" ON "BlockchainNetwork"("chainId");

-- CreateIndex
CREATE INDEX "BlockchainNetwork_isTestnet_isActive_idx" ON "BlockchainNetwork"("isTestnet", "isActive");

-- CreateIndex
CREATE INDEX "FactoryContract_networkId_isActive_idx" ON "FactoryContract"("networkId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FactoryContract_address_networkId_key" ON "FactoryContract"("address", "networkId");

-- CreateIndex
CREATE UNIQUE INDEX "EscrowWallet_address_key" ON "EscrowWallet"("address");

-- CreateIndex
CREATE INDEX "EscrowWallet_isActive_idx" ON "EscrowWallet"("isActive");

-- AddForeignKey
ALTER TABLE "FactoryContract" ADD CONSTRAINT "FactoryContract_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
