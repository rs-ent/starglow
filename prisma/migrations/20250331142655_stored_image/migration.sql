-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "icon" TEXT;

-- CreateTable
CREATE TABLE "StoredImage" (
    "id" TEXT NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "type" VARCHAR(50),
    "sourceUrl" VARCHAR(2048),
    "alt" VARCHAR(255),
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" VARCHAR(50),
    "sizeBytes" INTEGER,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoredImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoredImage_url_key" ON "StoredImage"("url");

-- CreateIndex
CREATE INDEX "StoredImage_url_sourceUrl_idx" ON "StoredImage"("url", "sourceUrl");
