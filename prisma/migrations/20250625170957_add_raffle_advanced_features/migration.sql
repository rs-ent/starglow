-- CreateEnum
CREATE TYPE "RaffleWeightingStrategy" AS ENUM ('EQUAL', 'ENTRY_BASED', 'ASSET_BASED', 'CUSTOM');

-- AlterTable
ALTER TABLE "Raffle" ADD COLUMN     "autoDistribute" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cooldownHours" INTEGER,
ADD COLUMN     "customWeightRules" JSONB[] DEFAULT ARRAY[]::JSONB[],
ADD COLUMN     "guaranteedWinConditions" JSONB,
ADD COLUMN     "maxDailyWins" INTEGER,
ADD COLUMN     "requireManualApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weightingStrategy" "RaffleWeightingStrategy" NOT NULL DEFAULT 'EQUAL',
ADD COLUMN     "winProbabilityPercent" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Raffle_winProbabilityPercent_idx" ON "Raffle"("winProbabilityPercent");
