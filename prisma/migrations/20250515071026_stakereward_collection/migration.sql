/*
  Warnings:

  - Added the required column `collectionAddress` to the `StakeReward` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StakeReward" ADD COLUMN     "collectionAddress" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "StakeReward" ADD CONSTRAINT "StakeReward_collectionAddress_fkey" FOREIGN KEY ("collectionAddress") REFERENCES "CollectionContract"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
