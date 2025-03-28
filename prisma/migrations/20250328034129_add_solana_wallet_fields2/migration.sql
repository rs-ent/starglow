/*
  Warnings:

  - You are about to drop the column `solPrivateKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `solPublicKey` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "solPrivateKey",
DROP COLUMN "solPublicKey",
ADD COLUMN     "privateKey" TEXT,
ADD COLUMN     "walletAddress" TEXT;
