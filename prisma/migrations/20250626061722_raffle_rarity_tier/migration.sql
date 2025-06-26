-- CreateEnum
CREATE TYPE "RarityTier" AS ENUM ('COSMIC', 'STELLAR', 'CELESTIAL', 'DIVINE', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON');

-- AlterTable
ALTER TABLE "RafflePrize" ADD COLUMN     "rarityOrder" INTEGER DEFAULT 9,
ADD COLUMN     "rarityTier" "RarityTier" DEFAULT 'COMMON';
