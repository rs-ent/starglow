/*
  Warnings:

  - Added the required column `tokenURICid` to the `Story_nft` table without a default value. This is not possible if the table is not empty.
  - Made the column `tokenURI` on table `Story_nft` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `baseURI` to the `Story_spg` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Story_nft" ADD COLUMN     "tokenURICid" TEXT NOT NULL,
ALTER COLUMN "tokenURI" SET NOT NULL;

-- AlterTable
ALTER TABLE "Story_spg" ADD COLUMN     "baseURI" TEXT NOT NULL;
