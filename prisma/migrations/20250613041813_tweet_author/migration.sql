/*
  Warnings:

  - You are about to drop the column `xId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tweetAuthorId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_xId_idx";

-- DropIndex
DROP INDEX "User_xId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "xId",
ADD COLUMN     "tweetAuthorId" TEXT;

-- CreateTable
CREATE TABLE "TweetAuthor" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "profileImageUrl" TEXT,

    CONSTRAINT "TweetAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TweetAuthor_authorId_key" ON "TweetAuthor"("authorId");

-- CreateIndex
CREATE INDEX "TweetAuthor_authorId_idx" ON "TweetAuthor"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tweetAuthorId_key" ON "User"("tweetAuthorId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tweetAuthorId_fkey" FOREIGN KEY ("tweetAuthorId") REFERENCES "TweetAuthor"("authorId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "TweetAuthor"("authorId") ON DELETE RESTRICT ON UPDATE CASCADE;
