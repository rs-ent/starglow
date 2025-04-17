/*
  Warnings:

  - You are about to drop the column `eventType` on the `WebhookEvent` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `WebhookEvent` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `WebhookEvent` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "WebhookEvent_createdAt_idx";

-- DropIndex
DROP INDEX "WebhookEvent_paymentId_eventType_idx";

-- AlterTable
ALTER TABLE "WebhookEvent" DROP COLUMN "eventType",
DROP COLUMN "processedAt",
DROP COLUMN "status",
ADD COLUMN     "description" TEXT,
ALTER COLUMN "paymentId" DROP NOT NULL,
ALTER COLUMN "payload" DROP NOT NULL;
