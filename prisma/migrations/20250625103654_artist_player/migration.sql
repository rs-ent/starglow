-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "artistId" TEXT,
ADD COLUMN     "isArtist" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Player_isArtist_idx" ON "Player"("isArtist");

-- CreateIndex
CREATE INDEX "Player_artistId_idx" ON "Player"("artistId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
