/*
  Warnings:

  - You are about to drop the column `minimumPoints` on the `Raffle` table. All the data in the column will be lost.
  - You are about to drop the column `minimumSGP` on the `Raffle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Raffle" DROP COLUMN "minimumPoints",
DROP COLUMN "minimumSGP",
ADD COLUMN     "isLimited" BOOLEAN NOT NULL DEFAULT true;
