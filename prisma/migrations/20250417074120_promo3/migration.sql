-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "convertedPrice" INTEGER,
ADD COLUMN     "exchangeRate" DOUBLE PRECISION,
ADD COLUMN     "exchangeRateProvider" TEXT,
ADD COLUMN     "exchangeRateTimestamp" TIMESTAMP(3),
ADD COLUMN     "originalProductPrice" INTEGER;
