-- CreateEnum
CREATE TYPE "CollectionParticipantType" AS ENUM ('PREREGISTRATION', 'PRESALE', 'PRIVATESALE', 'PUBLICSALE', 'GLOW');

-- CreateTable
CREATE TABLE "CollectionParticipant" (
    "id" TEXT NOT NULL,
    "type" "CollectionParticipantType" NOT NULL,
    "userId" TEXT NOT NULL,
    "collectionAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollectionParticipant_collectionAddress_type_idx" ON "CollectionParticipant"("collectionAddress", "type");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionParticipant_userId_collectionAddress_type_key" ON "CollectionParticipant"("userId", "collectionAddress", "type");

-- AddForeignKey
ALTER TABLE "CollectionParticipant" ADD CONSTRAINT "CollectionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionParticipant" ADD CONSTRAINT "CollectionParticipant_collectionAddress_fkey" FOREIGN KEY ("collectionAddress") REFERENCES "CollectionContract"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
