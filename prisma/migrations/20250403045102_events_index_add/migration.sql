-- CreateIndex
CREATE INDEX "Events_category_idx" ON "Events"("category");

-- CreateIndex
CREATE INDEX "Events_status_idx" ON "Events"("status");

-- CreateIndex
CREATE INDEX "Events_isFeatured_idx" ON "Events"("isFeatured");

-- CreateIndex
CREATE INDEX "Events_isActive_idx" ON "Events"("isActive");
