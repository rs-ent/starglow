/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `CollectionContract` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `CollectionContract` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CollectionContract" ADD COLUMN     "key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CollectionContract_key_key" ON "CollectionContract"("key");
