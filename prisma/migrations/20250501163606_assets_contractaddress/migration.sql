/*
  Warnings:

  - You are about to drop the column `assetsContractId` on the `Asset` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Asset" DROP CONSTRAINT "Asset_assetsContractId_fkey";

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "assetsContractId",
ADD COLUMN     "assetsContractAddress" TEXT;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_assetsContractAddress_fkey" FOREIGN KEY ("assetsContractAddress") REFERENCES "AssetsContract"("address") ON DELETE SET NULL ON UPDATE CASCADE;
