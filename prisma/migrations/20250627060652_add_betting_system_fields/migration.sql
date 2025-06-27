-- CreateEnum
CREATE TYPE "BettingStatus" AS ENUM ('OPEN', 'CLOSED', 'SETTLING', 'SETTLED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "bettingStatus" "BettingStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "houseCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
ADD COLUMN     "isSettled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "optionBetAmounts" JSONB,
ADD COLUMN     "settledAt" TIMESTAMP(3),
ADD COLUMN     "settledBy" TEXT,
ADD COLUMN     "totalCommissionAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "winningOptionId" TEXT;

-- AlterTable
ALTER TABLE "PollLog" ADD COLUMN     "isPayoutDistributed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payoutDistributedAt" TIMESTAMP(3),
ADD COLUMN     "payoutMultiplier" DOUBLE PRECISION;
