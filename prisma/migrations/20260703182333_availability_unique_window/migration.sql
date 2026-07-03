-- DropIndex
DROP INDEX "Availability_coachId_dayOfWeek_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Availability_coachId_dayOfWeek_startTime_endTime_key" ON "Availability"("coachId", "dayOfWeek", "startTime", "endTime");
