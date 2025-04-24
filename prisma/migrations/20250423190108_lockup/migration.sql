-- AlterTable
ALTER TABLE "NFT" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "unlockAt" TIMESTAMP(3),
ADD COLUMN     "unlockScheduledAt" TIMESTAMP(3);
