-- AlterTable
ALTER TABLE "Story_spg" ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "circulation" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "foregroundColor" TEXT,
ADD COLUMN     "glowEnd" TIMESTAMP(3),
ADD COLUMN     "glowStart" TIMESTAMP(3),
ADD COLUMN     "pageImages" TEXT[],
ADD COLUMN     "preOrderEnd" TIMESTAMP(3),
ADD COLUMN     "preOrderStart" TIMESTAMP(3),
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "saleEnd" TIMESTAMP(3),
ADD COLUMN     "saleStart" TIMESTAMP(3);
