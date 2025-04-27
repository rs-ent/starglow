/*
  Warnings:

  - Added the required column `updatedAt` to the `PollLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PollLog" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
