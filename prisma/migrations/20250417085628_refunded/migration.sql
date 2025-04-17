/*
  Warnings:

  - You are about to drop the column `cancelAmount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `cancelCurrency` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `cancelReason` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `refundAmount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `refundCurrency` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `refundReason` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "cancelAmount",
DROP COLUMN "cancelCurrency",
DROP COLUMN "cancelReason",
DROP COLUMN "refundAmount",
DROP COLUMN "refundCurrency",
DROP COLUMN "refundReason",
ADD COLUMN     "refundedAt" TIMESTAMP(3);
