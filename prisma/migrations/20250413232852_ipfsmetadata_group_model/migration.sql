-- AlterTable
ALTER TABLE "IpfsMetadata" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "IpfsGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpfsGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IpfsGroup_name_idx" ON "IpfsGroup"("name");

-- AddForeignKey
ALTER TABLE "IpfsMetadata" ADD CONSTRAINT "IpfsMetadata_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "IpfsGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
