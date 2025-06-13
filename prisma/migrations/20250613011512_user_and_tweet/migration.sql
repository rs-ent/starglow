/*
  Warnings:

  - A unique constraint covering the columns `[xId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "xId" TEXT;

-- CreateTable
CREATE TABLE "Tweet" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tweet_tweetId_key" ON "Tweet"("tweetId");

-- CreateIndex
CREATE INDEX "Tweet_authorId_idx" ON "Tweet"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "User_xId_key" ON "User"("xId");

-- CreateIndex
CREATE INDEX "User_xId_idx" ON "User"("xId");

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("xId") ON DELETE RESTRICT ON UPDATE CASCADE;
