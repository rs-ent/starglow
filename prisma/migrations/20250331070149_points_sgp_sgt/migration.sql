/*
  Warnings:

  - The `Currency` column on the `Daily Quests` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('Points', 'SGP', 'SGT');

-- AlterTable
ALTER TABLE "Daily Quests" DROP COLUMN "Currency",
ADD COLUMN     "Currency" "CurrencyType" DEFAULT 'Points';
