/*
  Warnings:

  - You are about to drop the column `onBanner` on the `StoredImage` table. All the data in the column will be lost.
  - Added the required column `bucket` to the `StoredImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StoredImage" DROP COLUMN "onBanner",
ADD COLUMN     "bucket" VARCHAR(50) NOT NULL,
ADD COLUMN     "purpose" VARCHAR(50);
