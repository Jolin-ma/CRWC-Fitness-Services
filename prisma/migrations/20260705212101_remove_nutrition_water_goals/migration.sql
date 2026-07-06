-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_studentId_fkey";

-- DropForeignKey
ALTER TABLE "NutritionEntry" DROP CONSTRAINT "NutritionEntry_loggedById_fkey";

-- DropForeignKey
ALTER TABLE "NutritionEntry" DROP CONSTRAINT "NutritionEntry_studentId_fkey";

-- DropForeignKey
ALTER TABLE "WaterEntry" DROP CONSTRAINT "WaterEntry_loggedById_fkey";

-- DropForeignKey
ALTER TABLE "WaterEntry" DROP CONSTRAINT "WaterEntry_studentId_fkey";

-- DropTable
DROP TABLE "Goal";

-- DropTable
DROP TABLE "NutritionEntry";

-- DropTable
DROP TABLE "WaterEntry";

-- DropEnum
DROP TYPE "GoalType";

-- DropEnum
DROP TYPE "MealType";

