/*
  Warnings:

  - You are about to drop the `PaymentLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PaymentLog" DROP CONSTRAINT "PaymentLog_userId_fkey";

-- DropTable
DROP TABLE "PaymentLog";

-- DropEnum
DROP TYPE "PaymentStatus";
