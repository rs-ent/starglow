/*
  Warnings:

  - You are about to drop the column `tweetAuthorId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tweetAuthorId]` on the table `Player` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tweetAuthorId_fkey";

-- DropIndex
DROP INDEX "User_tweetAuthorId_key";

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "tweetAuthorId" TEXT,
ADD COLUMN     "tweetVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "tweetAuthorId";

-- CreateIndex
CREATE UNIQUE INDEX "Player_tweetAuthorId_key" ON "Player"("tweetAuthorId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_tweetAuthorId_fkey" FOREIGN KEY ("tweetAuthorId") REFERENCES "TweetAuthor"("authorId") ON DELETE SET NULL ON UPDATE CASCADE;
