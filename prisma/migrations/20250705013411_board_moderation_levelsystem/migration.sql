-- CreateTable
CREATE TABLE "BoardModerationTrustLevelAction" (
    "id" TEXT NOT NULL,
    "trustLevel" INTEGER NOT NULL DEFAULT 0,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "postPerDay" INTEGER NOT NULL DEFAULT 5,
    "commentPerDay" INTEGER NOT NULL DEFAULT 10,
    "syllableLimit" INTEGER NOT NULL DEFAULT 1000,
    "linkPerPostLimit" INTEGER NOT NULL DEFAULT 0,
    "attachmentPerPostLimit" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "increaseReputationScoreByCleanPost" INTEGER NOT NULL DEFAULT 3,
    "increaseReputationScoreByCleanComment" INTEGER NOT NULL DEFAULT 1,
    "increaseReputationScoreByReportedPost" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardModerationTrustLevelAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoardModerationTrustLevelAction_trustLevel_key" ON "BoardModerationTrustLevelAction"("trustLevel");

-- CreateIndex
CREATE INDEX "BoardModerationTrustLevelAction_trustLevel_idx" ON "BoardModerationTrustLevelAction"("trustLevel");
