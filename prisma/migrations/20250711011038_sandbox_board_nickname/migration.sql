/*
  Warnings:

  - You are about to drop the column `isBoardArtist` on the `BoardComment` table. All the data in the column will be lost.
  - You are about to drop the column `sandBoxImgUrl` on the `BoardComment` table. All the data in the column will be lost.
  - You are about to drop the column `isBoardArtist` on the `BoardPost` table. All the data in the column will be lost.
  - You are about to drop the column `sandBoxImgUrl` on the `BoardPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BoardComment" DROP COLUMN "isBoardArtist",
DROP COLUMN "sandBoxImgUrl",
ADD COLUMN     "isSandboxBoardArtist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sandboxImgUrl" TEXT,
ADD COLUMN     "sandboxNickname" TEXT;

-- AlterTable
ALTER TABLE "BoardPost" DROP COLUMN "isBoardArtist",
DROP COLUMN "sandBoxImgUrl",
ADD COLUMN     "isSandboxBoardArtist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sandboxImgUrl" TEXT,
ADD COLUMN     "sandboxNickname" TEXT;
