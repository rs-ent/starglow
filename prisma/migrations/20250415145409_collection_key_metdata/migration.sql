/*
  Warnings:

  - Added the required column `collectionKey` to the `Metadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN     "collectionKey" TEXT NOT NULL;
