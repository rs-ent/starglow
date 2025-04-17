/*
  Warnings:

  - Added the required column `channelKey` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "channelKey" TEXT NOT NULL,
ADD COLUMN     "storeId" TEXT NOT NULL;
