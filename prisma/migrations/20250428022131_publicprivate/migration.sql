/*
  Warnings:

  - The values [GENERAL,NFT] on the enum `PollCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PollCategory_new" AS ENUM ('PUBLIC', 'PRIVATE');
ALTER TABLE "Poll" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "Poll" ALTER COLUMN "category" TYPE "PollCategory_new" USING ("category"::text::"PollCategory_new");
ALTER TYPE "PollCategory" RENAME TO "PollCategory_old";
ALTER TYPE "PollCategory_new" RENAME TO "PollCategory";
DROP TYPE "PollCategory_old";
ALTER TABLE "Poll" ALTER COLUMN "category" SET DEFAULT 'PUBLIC';
COMMIT;

-- AlterTable
ALTER TABLE "Poll" ALTER COLUMN "category" SET DEFAULT 'PUBLIC';
