-- CreateTable
CREATE TABLE "StakeReward" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "nftId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "isDistributed" BOOLEAN NOT NULL DEFAULT false,
    "distributedAt" TIMESTAMP(3),
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimableAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StakeReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StakeReward_assetId_idx" ON "StakeReward"("assetId");

-- CreateIndex
CREATE INDEX "StakeReward_nftId_idx" ON "StakeReward"("nftId");

-- AddForeignKey
ALTER TABLE "StakeReward" ADD CONSTRAINT "StakeReward_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeReward" ADD CONSTRAINT "StakeReward_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "NFT"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
