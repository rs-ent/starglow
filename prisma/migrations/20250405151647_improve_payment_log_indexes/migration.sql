-- CreateIndex
CREATE INDEX "PaymentLog_paymentKey_idx" ON "PaymentLog"("paymentKey");

-- CreateIndex
CREATE INDEX "PaymentLog_sessionHash_idx" ON "PaymentLog"("sessionHash");

-- CreateIndex
CREATE INDEX "PaymentLog_createdAt_idx" ON "PaymentLog"("createdAt");

-- CreateIndex
CREATE INDEX "PaymentLog_status_createdAt_idx" ON "PaymentLog"("status", "createdAt");
