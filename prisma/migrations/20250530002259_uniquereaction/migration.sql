/*
  Warnings:

  - A unique constraint covering the columns `[artistFeedId,playerId,reaction]` on the table `ArtistFeedReaction` will be added. If there are existing duplicate values, this will fail.
  - Made the column `reaction` on table `ArtistFeedReaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ArtistFeedReaction" ALTER COLUMN "reaction" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ArtistFeedReaction_artistFeedId_playerId_reaction_key" ON "ArtistFeedReaction"("artistFeedId", "playerId", "reaction");
