/*
  Warnings:

  - You are about to drop the column `primary` on the `Quest` table. All the data in the column will be lost.
  - You are about to drop the column `visible` on the `Quest` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Quest_permanent_visible_startDate_idx";

-- DropIndex
DROP INDEX "Quest_primary_visible_idx";

-- DropIndex
DROP INDEX "Quest_type_visible_idx";

-- AlterTable
ALTER TABLE "Quest" DROP COLUMN "primary",
DROP COLUMN "visible",
ADD COLUMN     "imgUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "order" INTEGER DEFAULT 0,
ADD COLUMN     "youtubeUrl" TEXT;

-- CreateIndex
CREATE INDEX "Quest_permanent_isActive_startDate_idx" ON "Quest"("permanent", "isActive", "startDate");

-- CreateIndex
CREATE INDEX "Quest_type_isActive_idx" ON "Quest"("type", "isActive");

-- CreateIndex
CREATE INDEX "Quest_order_isActive_idx" ON "Quest"("order", "isActive");
