-- AlterTable
ALTER TABLE "NFT" ADD COLUMN     "isStaked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stakedAt" TIMESTAMP(3),
ADD COLUMN     "unstakeScheduledAt" TIMESTAMP(3),
ADD COLUMN     "unstakedAt" TIMESTAMP(3);
