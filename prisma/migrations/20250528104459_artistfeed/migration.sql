-- CreateTable
CREATE TABLE "ArtistFeed" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "imageUrls" TEXT[],
    "videoUrls" TEXT[],
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistFeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistFeedReaction" (
    "id" TEXT NOT NULL,
    "artistFeedId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "reaction" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistFeedReaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ArtistFeed" ADD CONSTRAINT "ArtistFeed_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistFeedReaction" ADD CONSTRAINT "ArtistFeedReaction_artistFeedId_fkey" FOREIGN KEY ("artistFeedId") REFERENCES "ArtistFeed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistFeedReaction" ADD CONSTRAINT "ArtistFeedReaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
