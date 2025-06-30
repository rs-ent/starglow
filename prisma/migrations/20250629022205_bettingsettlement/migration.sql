-- CreateEnum
CREATE TYPE "PollBettingSettlementType" AS ENUM ('AUTO', 'MANUAL', 'REFUND', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "PollBettingSettlementStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL', 'PENDING', 'CANCELLED');

-- CreateTable
CREATE TABLE "PollBettingSettlementLog" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "settlementType" "PollBettingSettlementType" NOT NULL DEFAULT 'AUTO',
    "winningOptionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "totalPayout" INTEGER NOT NULL DEFAULT 0,
    "totalWinners" INTEGER NOT NULL DEFAULT 0,
    "totalBettingPool" INTEGER NOT NULL DEFAULT 0,
    "houseCommission" INTEGER NOT NULL DEFAULT 0,
    "houseCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "optionResults" JSONB,
    "payoutDistribution" JSONB,
    "settlementRule" JSONB,
    "tieBreakApplied" TEXT,
    "tieCount" INTEGER,
    "status" "PollBettingSettlementStatus" NOT NULL DEFAULT 'SUCCESS',
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "processedBy" TEXT,
    "processingTimeMs" INTEGER,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "alertsSent" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "settlementStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settlementCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PollBettingSettlementLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PollBettingSettlementLog_pollId_idx" ON "PollBettingSettlementLog"("pollId");

-- CreateIndex
CREATE INDEX "PollBettingSettlementLog_settlementType_status_idx" ON "PollBettingSettlementLog"("settlementType", "status");

-- CreateIndex
CREATE INDEX "PollBettingSettlementLog_createdAt_idx" ON "PollBettingSettlementLog"("createdAt");

-- CreateIndex
CREATE INDEX "PollBettingSettlementLog_status_isManual_idx" ON "PollBettingSettlementLog"("status", "isManual");

-- CreateIndex
CREATE INDEX "PollBettingSettlementLog_processedBy_createdAt_idx" ON "PollBettingSettlementLog"("processedBy", "createdAt");

-- AddForeignKey
ALTER TABLE "PollBettingSettlementLog" ADD CONSTRAINT "PollBettingSettlementLog_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
