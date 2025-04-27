/*
  Warnings:

  - You are about to drop the column `metadata` on the `PollLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PollLog" DROP COLUMN "metadata",
ADD COLUMN     "record" JSONB;
