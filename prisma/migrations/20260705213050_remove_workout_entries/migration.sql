-- DropForeignKey
ALTER TABLE "WorkoutEntry" DROP CONSTRAINT "WorkoutEntry_loggedById_fkey";

-- DropForeignKey
ALTER TABLE "WorkoutEntry" DROP CONSTRAINT "WorkoutEntry_studentId_fkey";

-- DropTable
DROP TABLE "WorkoutEntry";

