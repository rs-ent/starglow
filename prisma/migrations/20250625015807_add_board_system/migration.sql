-- CreateEnum
CREATE TYPE "BoardAuthorType" AS ENUM ('PLAYER', 'ARTIST', 'TEAM', 'ADMIN');

-- CreateEnum
CREATE TYPE "BoardReactionType" AS ENUM ('LIKE', 'DISLIKE', 'LOVE', 'LAUGH', 'ANGRY', 'SAD', 'RECOMMEND');

-- CreateEnum
CREATE TYPE "BoardRewardReason" AS ENUM ('POST_CREATION', 'POPULAR_POST', 'QUALITY_CONTENT', 'COMMUNITY_CONTRIBUTION', 'ARTIST_REWARD', 'TEAM_REWARD', 'MILESTONE_ACHIEVEMENT');

-- CreateEnum
CREATE TYPE "BoardRewardStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "artistId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "iconUrl" TEXT,
    "bannerUrl" TEXT,
    "rules" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardPost" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorType" "BoardAuthorType" NOT NULL DEFAULT 'PLAYER',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nftAddress" TEXT,
    "nftTokenId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "recommendCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorType" "BoardAuthorType" NOT NULL DEFAULT 'PLAYER',
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardReaction" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "postId" TEXT,
    "commentId" TEXT,
    "type" "BoardReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardPostReward" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "grantedBy" TEXT,
    "grantedByType" "BoardAuthorType",
    "assetId" TEXT,
    "amount" INTEGER NOT NULL,
    "reason" "BoardRewardReason" NOT NULL,
    "txHash" TEXT,
    "status" "BoardRewardStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "BoardPostReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Board_artistId_isActive_idx" ON "Board"("artistId", "isActive");

-- CreateIndex
CREATE INDEX "Board_isPublic_isActive_order_idx" ON "Board"("isPublic", "isActive", "order");

-- CreateIndex
CREATE INDEX "BoardPost_boardId_isPinned_createdAt_idx" ON "BoardPost"("boardId", "isPinned", "createdAt");

-- CreateIndex
CREATE INDEX "BoardPost_authorId_createdAt_idx" ON "BoardPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardPost_authorType_createdAt_idx" ON "BoardPost"("authorType", "createdAt");

-- CreateIndex
CREATE INDEX "BoardPost_recommendCount_createdAt_idx" ON "BoardPost"("recommendCount", "createdAt");

-- CreateIndex
CREATE INDEX "BoardPost_boardId_isHidden_isPinned_idx" ON "BoardPost"("boardId", "isHidden", "isPinned");

-- CreateIndex
CREATE INDEX "BoardComment_postId_parentId_createdAt_idx" ON "BoardComment"("postId", "parentId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardComment_authorId_createdAt_idx" ON "BoardComment"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "BoardComment_parentId_idx" ON "BoardComment"("parentId");

-- CreateIndex
CREATE INDEX "BoardReaction_postId_type_idx" ON "BoardReaction"("postId", "type");

-- CreateIndex
CREATE INDEX "BoardReaction_commentId_type_idx" ON "BoardReaction"("commentId", "type");

-- CreateIndex
CREATE INDEX "BoardReaction_playerId_idx" ON "BoardReaction"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "BoardReaction_playerId_postId_type_key" ON "BoardReaction"("playerId", "postId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "BoardReaction_playerId_commentId_type_key" ON "BoardReaction"("playerId", "commentId", "type");

-- CreateIndex
CREATE INDEX "BoardPostReward_postId_status_idx" ON "BoardPostReward"("postId", "status");

-- CreateIndex
CREATE INDEX "BoardPostReward_playerId_status_idx" ON "BoardPostReward"("playerId", "status");

-- CreateIndex
CREATE INDEX "BoardPostReward_grantedBy_createdAt_idx" ON "BoardPostReward"("grantedBy", "createdAt");

-- CreateIndex
CREATE INDEX "BoardPostReward_reason_status_idx" ON "BoardPostReward"("reason", "status");

-- CreateIndex
CREATE INDEX "RewardsLog_tweetAuthorId_reason_idx" ON "RewardsLog"("tweetAuthorId", "reason");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPost" ADD CONSTRAINT "BoardPost_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPost" ADD CONSTRAINT "BoardPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardComment" ADD CONSTRAINT "BoardComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BoardPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardComment" ADD CONSTRAINT "BoardComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardComment" ADD CONSTRAINT "BoardComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BoardComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardReaction" ADD CONSTRAINT "BoardReaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardReaction" ADD CONSTRAINT "BoardReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BoardPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardReaction" ADD CONSTRAINT "BoardReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "BoardComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPostReward" ADD CONSTRAINT "BoardPostReward_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BoardPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPostReward" ADD CONSTRAINT "BoardPostReward_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPostReward" ADD CONSTRAINT "BoardPostReward_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardPostReward" ADD CONSTRAINT "BoardPostReward_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
