/*
  Warnings:

  - The `options` column on the `Poll` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `option` on the `PollLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "options",
ADD COLUMN     "options" JSONB[];

-- AlterTable
ALTER TABLE "PollLog" DROP COLUMN "option",
ADD COLUMN     "option" JSONB NOT NULL;
