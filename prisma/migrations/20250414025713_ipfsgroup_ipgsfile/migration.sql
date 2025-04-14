-- CreateTable
CREATE TABLE "IpfsGroup" (
    "id" TEXT NOT NULL,
    "pinataId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpfsGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpfsFile" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'nft-metadata',
    "pinataId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "numberOfFiles" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "groupId" TEXT,
    "keyvalues" JSONB,
    "vectorized" BOOLEAN NOT NULL DEFAULT false,
    "network" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpfsFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IpfsGroup_pinataId_key" ON "IpfsGroup"("pinataId");

-- CreateIndex
CREATE INDEX "IpfsGroup_name_idx" ON "IpfsGroup"("name");

-- CreateIndex
CREATE INDEX "IpfsFile_pinataId_idx" ON "IpfsFile"("pinataId");

-- CreateIndex
CREATE INDEX "IpfsFile_name_idx" ON "IpfsFile"("name");

-- CreateIndex
CREATE INDEX "IpfsFile_groupId_idx" ON "IpfsFile"("groupId");

-- CreateIndex
CREATE INDEX "IpfsFile_cid_idx" ON "IpfsFile"("cid");

-- AddForeignKey
ALTER TABLE "IpfsFile" ADD CONSTRAINT "IpfsFile_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "IpfsGroup"("pinataId") ON DELETE SET NULL ON UPDATE CASCADE;
