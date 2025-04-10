-- AlterTable
ALTER TABLE "PaymentLog" ADD COLUMN     "vbankCode" TEXT,
ADD COLUMN     "vbankDate" TIMESTAMP(3),
ADD COLUMN     "vbankHolder" TEXT,
ADD COLUMN     "vbankNum" TEXT;

-- CreateIndex
CREATE INDEX "PaymentLog_vbankNum_idx" ON "PaymentLog"("vbankNum");
