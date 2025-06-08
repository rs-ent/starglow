-- CreateEnum
CREATE TYPE "TBAContractType" AS ENUM ('REGISTRY', 'IMPLEMENTATION');

-- CreateTable
CREATE TABLE "TBAContract" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "type" "TBAContractType" NOT NULL,
    "name" TEXT,
    "version" TEXT,
    "abi" JSONB,
    "bytecode" TEXT,
    "txHash" TEXT,
    "deployedBy" TEXT,
    "networkId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TBAContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TBAContract_address_key" ON "TBAContract"("address");

-- CreateIndex
CREATE INDEX "TBAContract_networkId_type_idx" ON "TBAContract"("networkId", "type");

-- CreateIndex
CREATE INDEX "TBAContract_networkId_type_isActive_idx" ON "TBAContract"("networkId", "type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TBAContract_networkId_type_address_key" ON "TBAContract"("networkId", "type", "address");

-- AddForeignKey
ALTER TABLE "TBAContract" ADD CONSTRAINT "TBAContract_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
