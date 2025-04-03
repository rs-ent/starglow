/*
  Warnings:

  - You are about to drop the `StoredFile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StoredImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "StoredFile";

-- DropTable
DROP TABLE "StoredImage";

-- CreateTable
CREATE TABLE "StoredFiles" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255),
    "url" VARCHAR(2048) NOT NULL,
    "type" VARCHAR(50),
    "sourceUrl" VARCHAR(2048),
    "alt" VARCHAR(255),
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" VARCHAR(50),
    "sizeBytes" INTEGER,
    "metadata" JSONB,
    "order" INTEGER DEFAULT 0,
    "purpose" VARCHAR(50),
    "bucket" VARCHAR(50) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoredFiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoredFiles_url_key" ON "StoredFiles"("url");

-- CreateIndex
CREATE INDEX "StoredFiles_url_sourceUrl_idx" ON "StoredFiles"("url", "sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "StoredFiles_sourceUrl_type_key" ON "StoredFiles"("sourceUrl", "type");
