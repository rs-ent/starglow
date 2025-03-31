/*
  Warnings:

  - The values [Points] on the enum `RewardCurrency` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RewardCurrency_new" AS ENUM ('points', 'SGP', 'SGT');
ALTER TABLE "PointsLog" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "Quest" ALTER COLUMN "rewardCurrency" DROP DEFAULT;
ALTER TABLE "Quest" ALTER COLUMN "rewardCurrency" TYPE "RewardCurrency_new" USING ("rewardCurrency"::text::"RewardCurrency_new");
ALTER TABLE "PointsLog" ALTER COLUMN "currency" TYPE "RewardCurrency_new" USING ("currency"::text::"RewardCurrency_new");
ALTER TYPE "RewardCurrency" RENAME TO "RewardCurrency_old";
ALTER TYPE "RewardCurrency_new" RENAME TO "RewardCurrency";
DROP TYPE "RewardCurrency_old";
ALTER TABLE "PointsLog" ALTER COLUMN "currency" SET DEFAULT 'points';
ALTER TABLE "Quest" ALTER COLUMN "rewardCurrency" SET DEFAULT 'points';
COMMIT;

-- AlterTable
ALTER TABLE "PointsLog" ALTER COLUMN "currency" SET DEFAULT 'points';

-- AlterTable
ALTER TABLE "Quest" ALTER COLUMN "rewardCurrency" SET DEFAULT 'points';
