/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `IpfsGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "IpfsGroup_name_key" ON "IpfsGroup"("name");

-- CreateIndex
CREATE INDEX "IpfsGroup_pinataId_idx" ON "IpfsGroup"("pinataId");
