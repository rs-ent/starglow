-- CreateIndex
CREATE INDEX "Events_saleStartDate_idx" ON "Events"("saleStartDate");

-- CreateIndex
CREATE INDEX "Events_saleEndDate_idx" ON "Events"("saleEndDate");

-- CreateIndex
CREATE INDEX "Events_price_idx" ON "Events"("price");

-- CreateIndex
CREATE INDEX "Events_category_status_idx" ON "Events"("category", "status");
