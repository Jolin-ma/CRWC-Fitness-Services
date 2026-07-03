-- CreateTable
CREATE TABLE "BodyStat" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "loggedById" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BodyStat_studentId_recordedAt_idx" ON "BodyStat"("studentId", "recordedAt");

-- AddForeignKey
ALTER TABLE "BodyStat" ADD CONSTRAINT "BodyStat_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyStat" ADD CONSTRAINT "BodyStat_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
