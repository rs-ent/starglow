-- AlterTable
ALTER TABLE "CollectionContract" ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pauseAt" TIMESTAMP(3),
ADD COLUMN     "unpauseAt" TIMESTAMP(3);
