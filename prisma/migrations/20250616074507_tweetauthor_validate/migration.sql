-- AlterTable
ALTER TABLE "TweetAuthor" ADD COLUMN     "registered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registeredAt" TIMESTAMP(3),
ADD COLUMN     "validated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "XAuthSession_expiresAt_idx" ON "XAuthSession"("expiresAt");
