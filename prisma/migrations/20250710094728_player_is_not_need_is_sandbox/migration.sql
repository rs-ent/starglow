-- DropForeignKey
ALTER TABLE "BoardComment" DROP CONSTRAINT "BoardComment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "BoardPost" DROP CONSTRAINT "BoardPost_authorId_fkey";

-- DropForeignKey
ALTER TABLE "BoardReaction" DROP CONSTRAINT "BoardReaction_playerId_fkey";

-- AlterTable
ALTER TABLE "BoardComment" ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BoardPost" ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BoardReaction" ALTER COLUMN "playerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BoardPost" ADD CONSTRAINT "BoardPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardComment" ADD CONSTRAINT "BoardComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardReaction" ADD CONSTRAINT "BoardReaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
