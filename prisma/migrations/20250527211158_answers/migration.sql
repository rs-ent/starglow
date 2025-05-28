/*
  Warnings:

  - You are about to drop the column `answerOptionId` on the `Poll` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PollAnswerOperation" AS ENUM ('AND', 'OR', 'NOT');

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "answerOptionId",
ADD COLUMN     "answerOperation" "PollAnswerOperation",
ADD COLUMN     "answerOptionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "hasAnswer" BOOLEAN NOT NULL DEFAULT false;
