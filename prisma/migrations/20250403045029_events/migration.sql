/*
  Warnings:

  - You are about to drop the `Concerts` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('concert', 'fanmeeting', 'fancamp', 'festival', 'exhibition', 'other');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- DropTable
DROP TABLE "Concerts";

-- CreateTable
CREATE TABLE "Events" (
    "id" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL DEFAULT 'other',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'upcoming',
    "bannerImg" TEXT,
    "bannerImg2" TEXT,
    "galleryImgs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "saleStartDate" TIMESTAMP(3),
    "saleEndDate" TIMESTAMP(3),
    "price" INTEGER,
    "capacity" INTEGER,
    "ageLimit" INTEGER,
    "organizer" TEXT,
    "organizerImg" TEXT,
    "organizerUrl" TEXT,
    "contact" TEXT,
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
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "promotionText" TEXT,
    "promotionImg" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Events_startDate_idx" ON "Events"("startDate");

-- CreateIndex
CREATE INDEX "Events_endDate_idx" ON "Events"("endDate");

-- CreateIndex
CREATE INDEX "Events_location_idx" ON "Events"("location");

-- CreateIndex
CREATE INDEX "Events_title_idx" ON "Events"("title");
