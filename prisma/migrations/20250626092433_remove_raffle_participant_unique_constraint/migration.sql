-- DropIndex
DROP INDEX "RaffleParticipant_raffleId_playerId_key";

-- CreateIndex
CREATE INDEX "RaffleParticipant_raffleId_playerId_idx" ON "RaffleParticipant"("raffleId", "playerId");
