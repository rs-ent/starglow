-- CreateTable
CREATE TABLE "Concerts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "bannerImg" TEXT,
    "bannerImg2" TEXT,
    "galleryImgs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "locationAddress" TEXT,
    "locationImg" TEXT,
    "locationUrl" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "artist" TEXT,
    "artistImg" TEXT,
    "artistUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Concerts_startDate_idx" ON "Concerts"("startDate");

-- CreateIndex
CREATE INDEX "Concerts_endDate_idx" ON "Concerts"("endDate");

-- CreateIndex
CREATE INDEX "Concerts_location_idx" ON "Concerts"("location");

-- CreateIndex
CREATE INDEX "Concerts_title_idx" ON "Concerts"("title");
