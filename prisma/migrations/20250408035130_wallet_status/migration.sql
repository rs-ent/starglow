-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE';
