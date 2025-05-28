/*
  Warnings:

  - You are about to drop the column `option` on the `PollLog` table. All the data in the column will be lost.
  - You are about to drop the column `optionId` on the `PollLog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PollLog_playerId_pollId_optionId_key";

-- AlterTable
ALTER TABLE "PollLog" DROP COLUMN "option",
DROP COLUMN "optionId",
ADD COLUMN     "optionIds" TEXT[],
ADD COLUMN     "options" JSONB[];
