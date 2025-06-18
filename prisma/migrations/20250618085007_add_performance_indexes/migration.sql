-- CreateIndex
CREATE INDEX "ArtistFeed_artistId_createdAt_idx" ON "ArtistFeed"("artistId", "createdAt");

-- CreateIndex
CREATE INDEX "Events_artistUrl_idx" ON "Events"("artistUrl");

-- CreateIndex
CREATE INDEX "Events_createdAt_idx" ON "Events"("createdAt");

-- CreateIndex
CREATE INDEX "NFT_isStaked_stakedAt_idx" ON "NFT"("isStaked", "stakedAt");

-- CreateIndex
CREATE INDEX "NFT_isListed_idx" ON "NFT"("isListed");

-- CreateIndex
CREATE INDEX "NFT_mintedAt_idx" ON "NFT"("mintedAt");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_productTable_productId_idx" ON "Payment"("productTable", "productId");

-- CreateIndex
CREATE INDEX "Payment_channelKey_idx" ON "Payment"("channelKey");

-- CreateIndex
CREATE INDEX "Payment_paymentId_idx" ON "Payment"("paymentId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Player_createdAt_idx" ON "Player"("createdAt");

-- CreateIndex
CREATE INDEX "Player_lastConnectedAt_idx" ON "Player"("lastConnectedAt");

-- CreateIndex
CREATE INDEX "Poll_status_startDate_idx" ON "Poll"("status", "startDate");

-- CreateIndex
CREATE INDEX "Poll_isActive_startDate_idx" ON "Poll"("isActive", "startDate");

-- CreateIndex
CREATE INDEX "Quest_artistId_isActive_idx" ON "Quest"("artistId", "isActive");

-- CreateIndex
CREATE INDEX "Quest_questType_isActive_idx" ON "Quest"("questType", "isActive");

-- CreateIndex
CREATE INDEX "Tweet_isDeleted_idx" ON "Tweet"("isDeleted");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Wallet_status_idx" ON "Wallet"("status");

-- CreateIndex
CREATE INDEX "Wallet_createdAt_idx" ON "Wallet"("createdAt");
