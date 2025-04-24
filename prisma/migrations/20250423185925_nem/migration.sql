-- AlterTable
ALTER TABLE "CollectionContract" ADD COLUMN     "abi" JSONB,
ADD COLUMN     "bytecode" TEXT;

-- AlterTable
ALTER TABLE "FactoryContract" ADD COLUMN     "abi" JSONB,
ADD COLUMN     "bytecode" TEXT;
