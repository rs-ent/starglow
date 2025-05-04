-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "artistId" TEXT;

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "artistId" TEXT;

-- CreateTable
CREATE TABLE "ArtistMessage" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "externalUrl" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistMessage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistMessage" ADD CONSTRAINT "ArtistMessage_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
