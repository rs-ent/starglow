-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "size" INTEGER NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "blobId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoredFile_url_key" ON "StoredFile"("url");

-- CreateIndex
CREATE INDEX "StoredFile_url_idx" ON "StoredFile"("url");

-- CreateIndex
CREATE INDEX "StoredFile_purpose_idx" ON "StoredFile"("purpose");
