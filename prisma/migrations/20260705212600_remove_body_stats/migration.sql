-- DropForeignKey
ALTER TABLE "BodyStat" DROP CONSTRAINT "BodyStat_loggedById_fkey";

-- DropForeignKey
ALTER TABLE "BodyStat" DROP CONSTRAINT "BodyStat_studentId_fkey";

-- DropTable
DROP TABLE "BodyStat";

