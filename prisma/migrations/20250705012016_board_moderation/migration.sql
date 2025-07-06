-- CreateEnum
CREATE TYPE "BoardModerationReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'DISMISSED', 'RESOLVED', 'WARNED', 'BANNED', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "BoardModerationReportType" AS ENUM ('UNKNOWN', 'AUTO_RULE', 'SPAM_DETECTION', 'AI_FLAGGED', 'USER_REPORT', 'MODERATOR_REPORT');

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "boardReputationScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "boardTrustLevel" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BoardModerationRule" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stopWords" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardModerationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardModerationReport" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "reporterId" TEXT,
    "offenderId" TEXT,
    "relatedRuleId" TEXT,
    "reason" TEXT,
    "type" "BoardModerationReportType" NOT NULL DEFAULT 'UNKNOWN',
    "status" "BoardModerationReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewResult" TEXT,
    "reviewAt" TIMESTAMP(3),
    "reviewBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardModerationReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoardModerationReport_status_createdAt_idx" ON "BoardModerationReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BoardModerationReport_type_createdAt_idx" ON "BoardModerationReport"("type", "createdAt");

-- CreateIndex
CREATE INDEX "BoardModerationReport_reporterId_createdAt_idx" ON "BoardModerationReport"("reporterId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardModerationReport_offenderId_createdAt_idx" ON "BoardModerationReport"("offenderId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardModerationReport_relatedRuleId_createdAt_idx" ON "BoardModerationReport"("relatedRuleId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardModerationReport_boardId_createdAt_idx" ON "BoardModerationReport"("boardId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardModerationReport_postId_createdAt_idx" ON "BoardModerationReport"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardModerationReport_commentId_createdAt_idx" ON "BoardModerationReport"("commentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BoardModerationReport_reporterId_boardId_postId_commentId_key" ON "BoardModerationReport"("reporterId", "boardId", "postId", "commentId");

-- AddForeignKey
ALTER TABLE "BoardModerationReport" ADD CONSTRAINT "BoardModerationReport_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardModerationReport" ADD CONSTRAINT "BoardModerationReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BoardPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardModerationReport" ADD CONSTRAINT "BoardModerationReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "BoardComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardModerationReport" ADD CONSTRAINT "BoardModerationReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardModerationReport" ADD CONSTRAINT "BoardModerationReport_offenderId_fkey" FOREIGN KEY ("offenderId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardModerationReport" ADD CONSTRAINT "BoardModerationReport_relatedRuleId_fkey" FOREIGN KEY ("relatedRuleId") REFERENCES "BoardModerationRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
