-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- AlterTable
ALTER TABLE "NutritionEntry" ADD COLUMN "mealType" "MealType" NOT NULL DEFAULT 'SNACK';

-- CreateTable
CREATE TABLE "WaterEntry" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "loggedById" INTEGER NOT NULL,
    "ounces" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaterEntry_studentId_recordedAt_idx" ON "WaterEntry"("studentId", "recordedAt");

-- AddForeignKey
ALTER TABLE "WaterEntry" ADD CONSTRAINT "WaterEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterEntry" ADD CONSTRAINT "WaterEntry_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
