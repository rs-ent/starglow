-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "backgroundColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "foregroundColors" TEXT[] DEFAULT ARRAY[]::TEXT[];
