-- AlterTable
ALTER TABLE "Story_spg" ADD COLUMN     "contractAddress" TEXT;

-- CreateTable
CREATE TABLE "Story_spgContract" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "abi" JSONB,
    "bytecode" TEXT,
    "txHash" TEXT,
    "networkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_spgContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Story_spgContract_address_key" ON "Story_spgContract"("address");

-- CreateIndex
CREATE INDEX "Story_spgContract_networkId_idx" ON "Story_spgContract"("networkId");

-- AddForeignKey
ALTER TABLE "Story_spgContract" ADD CONSTRAINT "Story_spgContract_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story_spg" ADD CONSTRAINT "Story_spg_contractAddress_fkey" FOREIGN KEY ("contractAddress") REFERENCES "Story_spgContract"("address") ON DELETE SET NULL ON UPDATE CASCADE;
