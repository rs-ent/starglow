/*
  Warnings:

  - Added the required column `artistId` to the `Story_spg` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Story_spg" ADD COLUMN     "artistId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Story_spg" ADD CONSTRAINT "Story_spg_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
