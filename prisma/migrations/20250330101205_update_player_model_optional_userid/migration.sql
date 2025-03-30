/*
  Warnings:

  - You are about to drop the column `first_name` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `recommenderId` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `recommenderName` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Player` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "recommenderId",
DROP COLUMN "recommenderName",
DROP COLUMN "username",
ADD COLUMN     "name" TEXT,
ADD COLUMN     "snsId" TEXT,
ADD COLUMN     "vipUntil" TIMESTAMP(3),
ALTER COLUMN "userId" DROP NOT NULL;
