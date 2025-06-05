-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "multiClaimInterval" INTEGER,
ADD COLUMN     "multiClaimLimit" INTEGER,
ADD COLUMN     "multiClaimable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "urls" TEXT[];
