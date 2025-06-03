/*
  Warnings:

  - You are about to drop the `IpfsFile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IpfsGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "IpfsFile" DROP CONSTRAINT "IpfsFile_groupId_fkey";

-- DropTable
DROP TABLE "IpfsFile";

-- DropTable
DROP TABLE "IpfsGroup";
