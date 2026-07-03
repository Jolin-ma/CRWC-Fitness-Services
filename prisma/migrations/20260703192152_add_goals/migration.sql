-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('WEIGHT', 'FREEFORM');

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "type" "GoalType" NOT NULL,
    "title" TEXT NOT NULL,
    "targetWeight" DOUBLE PRECISION,
    "startingWeight" DOUBLE PRECISION,
    "targetDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_studentId_idx" ON "Goal"("studentId");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
