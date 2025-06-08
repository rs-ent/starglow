-- AlterTable
ALTER TABLE "Story_spg" ADD COLUMN     "tbaImplementationAddress" TEXT,
ADD COLUMN     "tbaRegistryAddress" TEXT;

-- CreateIndex
CREATE INDEX "Story_spg_tbaRegistryAddress_idx" ON "Story_spg"("tbaRegistryAddress");

-- CreateIndex
CREATE INDEX "Story_spg_tbaImplementationAddress_idx" ON "Story_spg"("tbaImplementationAddress");
