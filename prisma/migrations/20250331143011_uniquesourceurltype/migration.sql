/*
  Warnings:

  - A unique constraint covering the columns `[sourceUrl,type]` on the table `StoredImage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StoredImage_sourceUrl_type_key" ON "StoredImage"("sourceUrl", "type");
