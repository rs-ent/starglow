-- CreateEnum
CREATE TYPE "RaffleInstantType" AS ENUM ('PROBABILITY', 'GUARANTEED', 'SCRATCH_CARD', 'FIRST_COME');

-- CreateEnum
CREATE TYPE "RaffleInstantResult" AS ENUM ('WIN', 'LOSE', 'PENDING');

-- AlterTable
ALTER TABLE "Raffle" ADD COLUMN     "currentInstantWinners" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "guaranteedWinPositions" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "instantPrizePool" JSONB,
ADD COLUMN     "instantReveal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "instantRevealType" "RaffleInstantType" NOT NULL DEFAULT 'PROBABILITY',
ADD COLUMN     "instantWinProbability" DOUBLE PRECISION,
ADD COLUMN     "maxInstantWinners" INTEGER;

-- AlterTable
ALTER TABLE "RaffleParticipant" ADD COLUMN     "instantPosition" INTEGER,
ADD COLUMN     "instantPrizeId" TEXT,
ADD COLUMN     "instantRandomValue" DOUBLE PRECISION,
ADD COLUMN     "instantResult" "RaffleInstantResult",
ADD COLUMN     "instantResultAt" TIMESTAMP(3),
ADD COLUMN     "isRevealed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revealedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RafflePrize" ADD COLUMN     "availableForInstant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "instantWinnersCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxInstantWinners" INTEGER;

-- AlterTable
ALTER TABLE "RaffleWinner" ADD COLUMN     "instantWinAt" TIMESTAMP(3),
ADD COLUMN     "isInstantWin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Raffle_instantReveal_instantRevealType_idx" ON "Raffle"("instantReveal", "instantRevealType");

-- CreateIndex
CREATE INDEX "Raffle_currentInstantWinners_maxInstantWinners_idx" ON "Raffle"("currentInstantWinners", "maxInstantWinners");

-- CreateIndex
CREATE INDEX "RaffleParticipant_instantResultAt_idx" ON "RaffleParticipant"("instantResultAt");

-- CreateIndex
CREATE INDEX "RaffleParticipant_raffleId_isRevealed_idx" ON "RaffleParticipant"("raffleId", "isRevealed");

-- CreateIndex
CREATE INDEX "RaffleParticipant_revealedAt_idx" ON "RaffleParticipant"("revealedAt");

-- CreateIndex
CREATE INDEX "RafflePrize_availableForInstant_instantWinnersCount_idx" ON "RafflePrize"("availableForInstant", "instantWinnersCount");

-- CreateIndex
CREATE INDEX "RaffleWinner_isInstantWin_instantWinAt_idx" ON "RaffleWinner"("isInstantWin", "instantWinAt");

-- AddForeignKey
ALTER TABLE "RaffleParticipant" ADD CONSTRAINT "RaffleParticipant_instantPrizeId_fkey" FOREIGN KEY ("instantPrizeId") REFERENCES "RafflePrize"("id") ON DELETE SET NULL ON UPDATE CASCADE;
