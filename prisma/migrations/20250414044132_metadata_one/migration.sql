/*
  Warnings:

  - A unique constraint covering the columns `[collectionContractId]` on the table `Metadata` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Metadata_collectionContractId_key" ON "Metadata"("collectionContractId");
