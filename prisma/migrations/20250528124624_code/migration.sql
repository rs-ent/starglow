/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Artist` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Artist_code_key" ON "Artist"("code");

-- CreateIndex
CREATE INDEX "Artist_code_idx" ON "Artist"("code");
