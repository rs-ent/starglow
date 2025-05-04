-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "needToken" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "needTokenAddress" TEXT;
