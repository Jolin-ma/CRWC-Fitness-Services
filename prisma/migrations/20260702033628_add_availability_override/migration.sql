-- CreateTable
CREATE TABLE "AvailabilityOverride" (
    "id" SERIAL NOT NULL,
    "coachId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityOverride_coachId_date_key" ON "AvailabilityOverride"("coachId", "date");

-- AddForeignKey
ALTER TABLE "AvailabilityOverride" ADD CONSTRAINT "AvailabilityOverride_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
