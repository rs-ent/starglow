-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "postProcessResult" JSONB,
ADD COLUMN     "postProcessResultAt" TIMESTAMP(3),
ADD COLUMN     "receiverWalletAddress" TEXT;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receiverWalletAddress_fkey" FOREIGN KEY ("receiverWalletAddress") REFERENCES "Wallet"("address") ON DELETE SET NULL ON UPDATE CASCADE;
