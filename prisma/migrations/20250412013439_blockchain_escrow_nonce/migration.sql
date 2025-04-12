/*
  Warnings:

  - Added the required column `nonce` to the `EscrowWallet` table without a default value. This is not possible if the table is not empty.
  - Made the column `privateKey` on table `EscrowWallet` required. This step will fail if there are existing NULL values in that column.
  - Made the column `keyHash` on table `EscrowWallet` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "EscrowWallet" ADD COLUMN     "nonce" TEXT NOT NULL,
ALTER COLUMN "privateKey" SET NOT NULL,
ALTER COLUMN "keyHash" SET NOT NULL;
