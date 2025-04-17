/*
  Warnings:

  - You are about to drop the column `clientHash` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `nonce` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `serverHash` on the `Payment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Payment_clientHash_serverHash_key";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "clientHash",
DROP COLUMN "nonce",
DROP COLUMN "serverHash";
