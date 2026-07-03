-- AlterTable
ALTER TABLE "User" ADD COLUMN "startDate" TIMESTAMP(3);

-- Backfill existing students with their account creation date as a default start date.
UPDATE "User" SET "startDate" = "createdAt" WHERE "role" = 'STUDENT';
