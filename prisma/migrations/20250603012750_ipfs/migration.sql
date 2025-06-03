-- CreateTable
CREATE TABLE "ipfs" (
    "id" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ipfs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ipfs_cid_key" ON "ipfs"("cid");

-- CreateIndex
CREATE UNIQUE INDEX "ipfs_url_key" ON "ipfs"("url");
