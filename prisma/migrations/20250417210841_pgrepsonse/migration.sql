/*
  Warnings:

  - You are about to drop the column `pgTxId` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "pgTxId",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "pgCode" TEXT,
ADD COLUMN     "pgMessage" TEXT,
ADD COLUMN     "transactionType" TEXT,
ADD COLUMN     "txId" TEXT;
