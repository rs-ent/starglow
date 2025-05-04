-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "repeatable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "repeatableCount" INTEGER,
ADD COLUMN     "repeatableInterval" INTEGER;
