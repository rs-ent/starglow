/*
  Warnings:

  - You are about to drop the `Raffle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RaffleParticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RafflePrize` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RaffleWinner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Raffle" DROP CONSTRAINT "Raffle_artistId_fkey";

-- DropForeignKey
ALTER TABLE "Raffle" DROP CONSTRAINT "Raffle_entryFeeAssetId_fkey";

-- DropForeignKey
ALTER TABLE "Raffle" DROP CONSTRAINT "Raffle_requiredAssetId_fkey";

-- DropForeignKey
ALTER TABLE "RaffleParticipant" DROP CONSTRAINT "RaffleParticipant_instantPrizeId_fkey";

-- DropForeignKey
ALTER TABLE "RaffleParticipant" DROP CONSTRAINT "RaffleParticipant_playerId_fkey";

-- DropForeignKey
ALTER TABLE "RaffleParticipant" DROP CONSTRAINT "RaffleParticipant_raffleId_fkey";

-- DropForeignKey
ALTER TABLE "RafflePrize" DROP CONSTRAINT "RafflePrize_prizeAssetId_fkey";

-- DropForeignKey
ALTER TABLE "RafflePrize" DROP CONSTRAINT "RafflePrize_prizeSPGAddress_fkey";

-- DropForeignKey
ALTER TABLE "RafflePrize" DROP CONSTRAINT "RafflePrize_raffleId_fkey";

-- DropForeignKey
ALTER TABLE "RaffleWinner" DROP CONSTRAINT "RaffleWinner_playerId_fkey";

-- DropForeignKey
ALTER TABLE "RaffleWinner" DROP CONSTRAINT "RaffleWinner_prizeAssetId_fkey";

-- DropForeignKey
ALTER TABLE "RaffleWinner" DROP CONSTRAINT "RaffleWinner_prizeSPGAddress_fkey";

-- DropForeignKey
ALTER TABLE "RaffleWinner" DROP CONSTRAINT "RaffleWinner_raffleId_fkey";

-- DropForeignKey
ALTER TABLE "RaffleWinner" DROP CONSTRAINT "RaffleWinner_rafflePrizeId_fkey";

-- DropForeignKey
ALTER TABLE "RewardsLog" DROP CONSTRAINT "RewardsLog_raffleId_fkey";

-- DropForeignKey
ALTER TABLE "RewardsLog" DROP CONSTRAINT "RewardsLog_raffleParticipantId_fkey";

-- DropTable
DROP TABLE "Raffle";

-- DropTable
DROP TABLE "RaffleParticipant";

-- DropTable
DROP TABLE "RafflePrize";

-- DropTable
DROP TABLE "RaffleWinner";

-- DropEnum
DROP TYPE "RaffleCategory";

-- DropEnum
DROP TYPE "RaffleInstantResult";

-- DropEnum
DROP TYPE "RaffleInstantType";

-- DropEnum
DROP TYPE "RafflePrizeStatus";

-- DropEnum
DROP TYPE "RafflePrizeType";

-- DropEnum
DROP TYPE "RaffleStatus";

-- DropEnum
DROP TYPE "RaffleWeightingStrategy";
