-- AlterTable
ALTER TABLE "User" ADD COLUMN     "discordId" TEXT;

-- CreateTable
CREATE TABLE "DiscordAccount" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "userIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscordAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DiscordCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordAccount_discordId_key" ON "DiscordAccount"("discordId");

-- CreateIndex
CREATE INDEX "DiscordAccount_discordId_idx" ON "DiscordAccount"("discordId");

-- CreateIndex
CREATE INDEX "DiscordAccount_userIds_idx" ON "DiscordAccount"("userIds");

-- CreateIndex
CREATE INDEX "DiscordAccount_createdAt_idx" ON "DiscordAccount"("createdAt");

-- CreateIndex
CREATE INDEX "DiscordAccount_updatedAt_idx" ON "DiscordAccount"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiscordCode_code_key" ON "DiscordCode"("code");

-- CreateIndex
CREATE INDEX "DiscordCode_code_idx" ON "DiscordCode"("code");

-- CreateIndex
CREATE INDEX "DiscordCode_expiresAt_idx" ON "DiscordCode"("expiresAt");

-- CreateIndex
CREATE INDEX "DiscordCode_userId_idx" ON "DiscordCode"("userId");

-- AddForeignKey
ALTER TABLE "DiscordCode" ADD CONSTRAINT "DiscordCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
