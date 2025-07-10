-- AlterTable
ALTER TABLE "BoardComment" ADD COLUMN     "isBoardArtist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSandbox" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sandBoxImgUrl" TEXT;

-- AlterTable
ALTER TABLE "BoardPost" ADD COLUMN     "isBoardArtist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSandbox" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sandBoxImgUrl" TEXT;
