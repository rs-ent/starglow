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

    CONSTRAINT "CollectionContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollectionContract_address_networkId_idx" ON "CollectionContract"("address", "networkId");

-- CreateIndex
CREATE INDEX "CollectionContract_factoryId_idx" ON "CollectionContract"("factoryId");

-- CreateIndex
CREATE INDEX "CollectionContract_createdBy_createdAt_idx" ON "CollectionContract"("createdBy", "createdAt");

-- AddForeignKey
ALTER TABLE "CollectionContract" ADD CONSTRAINT "CollectionContract_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "FactoryContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionContract" ADD CONSTRAINT "CollectionContract_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "BlockchainNetwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
