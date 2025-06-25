-- AlterTable
ALTER TABLE "BoardComment" ADD COLUMN     "files" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- AlterTable
ALTER TABLE "BoardPost" ADD COLUMN     "files" JSONB[] DEFAULT ARRAY[]::JSONB[];
