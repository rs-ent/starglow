/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Story_spg` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[symbol]` on the table `Story_spg` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[artistId]` on the table `Story_spg` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Story_spg_name_key" ON "Story_spg"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Story_spg_symbol_key" ON "Story_spg"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Story_spg_artistId_key" ON "Story_spg"("artistId");

-- CreateIndex
CREATE INDEX "Story_spg_name_idx" ON "Story_spg"("name");

-- CreateIndex
CREATE INDEX "Story_spg_symbol_idx" ON "Story_spg"("symbol");

-- CreateIndex
CREATE INDEX "Story_spg_artistId_idx" ON "Story_spg"("artistId");
