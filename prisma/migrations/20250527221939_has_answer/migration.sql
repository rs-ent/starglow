/*
  Warnings:

  - You are about to drop the column `answerOperation` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `optionIds` on the `PollLog` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `PollLog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[playerId,pollId,optionId]` on the table `PollLog` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `option` to the `PollLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `optionId` to the `PollLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "answerOperation";

-- AlterTable
ALTER TABLE "PollLog" DROP COLUMN "optionIds",
DROP COLUMN "options",
ADD COLUMN     "option" JSONB NOT NULL,
ADD COLUMN     "optionId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "PollAnswerOperation";

-- CreateIndex
CREATE UNIQUE INDEX "PollLog_playerId_pollId_optionId_key" ON "PollLog"("playerId", "pollId", "optionId");
