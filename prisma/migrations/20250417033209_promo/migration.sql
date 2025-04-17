-- CreateEnum
CREATE TYPE "PaymentPromotionDiscountType" AS ENUM ('percentage', 'amount');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "promotionCode" TEXT;

-- CreateTable
CREATE TABLE "PaymentPromotion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "discountType" "PaymentPromotionDiscountType" NOT NULL DEFAULT 'percentage',
    "discountValue" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPromotion_code_key" ON "PaymentPromotion"("code");

-- CreateIndex
CREATE INDEX "PaymentPromotion_code_idx" ON "PaymentPromotion"("code");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_promotionCode_fkey" FOREIGN KEY ("promotionCode") REFERENCES "PaymentPromotion"("code") ON DELETE SET NULL ON UPDATE CASCADE;
