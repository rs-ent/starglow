-- DropForeignKey
ALTER TABLE "Story_spg" DROP CONSTRAINT "Story_spg_artistId_fkey";

-- AlterTable
ALTER TABLE "Story_spg" ALTER COLUMN "artistId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Story_spg" ADD CONSTRAINT "Story_spg_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
