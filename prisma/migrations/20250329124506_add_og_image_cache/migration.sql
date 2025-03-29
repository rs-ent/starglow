-- CreateTable
CREATE TABLE "OgImageCache" (
    "id" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OgImageCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OgImageCache_targetUrl_key" ON "OgImageCache"("targetUrl");
