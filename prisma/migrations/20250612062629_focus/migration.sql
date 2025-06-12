-- AlterTable
ALTER TABLE "StoredFiles" ADD COLUMN     "focusX" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "focusY" DOUBLE PRECISION NOT NULL DEFAULT 0.5;

-- CreateIndex
CREATE INDEX "StoredFiles_url_idx" ON "StoredFiles"("url");
