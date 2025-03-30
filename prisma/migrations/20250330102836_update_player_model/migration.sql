/*
  Warnings:

  - You are about to drop the column `rank` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `snsId` on the `Player` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "rank",
DROP COLUMN "snsId",
ADD COLUMN     "recommenderId" TEXT,
ADD COLUMN     "recommenderMethod" TEXT,
ADD COLUMN     "recommenderName" TEXT;
