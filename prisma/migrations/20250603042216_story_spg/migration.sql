-- CreateTable
CREATE TABLE "Story_spg" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contractURI" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "networkId" TEXT NOT NULL,
    "ownerAddress" TEXT NOT NULL,

    CONSTRAINT "Story_spg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Story_spg_address_key" ON "Story_spg"("address");

-- CreateIndex
CREATE INDEX "Story_spg_networkId_idx" ON "Story_spg"("networkId");

-- CreateIndex
CREATE INDEX "Story_spg_ownerAddress_idx" ON "Story_spg"("ownerAddress");

-- CreateIndex
CREATE INDEX "Story_spg_ownerAddress_networkId_idx" ON "Story_spg"("ownerAddress", "networkId");

-- CreateIndex
CREATE INDEX "Story_spg_address_idx" ON "Story_spg"("address");

-- AddForeignKey
ALTER TABLE "Story_spg" ADD CONSTRAINT "Story_spg_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
