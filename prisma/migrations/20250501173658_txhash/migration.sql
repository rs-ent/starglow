/*
  Warnings:

  - You are about to drop the column `data` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `selector` on the `AssetTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `txHash` on the `AssetTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transactionHash]` on the table `AssetTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `transactionHash` to the `AssetTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AssetTransaction_txHash_idx";

-- AlterTable
ALTER TABLE "AssetTransaction" DROP COLUMN "data",
DROP COLUMN "result",
DROP COLUMN "selector",
DROP COLUMN "txHash",
ADD COLUMN     "amount" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "receiverAddress" TEXT,
ADD COLUMN     "transactionHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AssetTransaction_transactionHash_key" ON "AssetTransaction"("transactionHash");

-- CreateIndex
CREATE INDEX "AssetTransaction_transactionHash_idx" ON "AssetTransaction"("transactionHash");
