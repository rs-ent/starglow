/*
  Warnings:

  - Made the column `completedAt` on table `QuestLog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "QuestLog" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "completedAt" SET NOT NULL,
ALTER COLUMN "completedAt" SET DEFAULT CURRENT_TIMESTAMP;
