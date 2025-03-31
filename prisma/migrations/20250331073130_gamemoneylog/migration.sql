-- CreateTable
CREATE TABLE "GameMoneyLog" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "Price" INTEGER NOT NULL DEFAULT 0,
    "Currency" "CurrencyType" DEFAULT 'Points',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameMoneyLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GameMoneyLog" ADD CONSTRAINT "GameMoneyLog_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
