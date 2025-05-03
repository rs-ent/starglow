/*
  Warnings:

  - You are about to drop the column `participationRewards` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `rewardCurrency` on the `Poll` table. All the data in the column will be lost.
  - You are about to drop the column `winnerRewards` on the `Poll` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "participationRewards",
DROP COLUMN "rewardCurrency",
DROP COLUMN "winnerRewards";
