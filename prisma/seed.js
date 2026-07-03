import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { fullName: "Brianna" },
    create: {
      email: "admin@example.com",
      passwordHash,
      fullName: "Brianna",
      role: "ADMIN",
    },
  });

  const coach = await prisma.user.upsert({
    where: { email: "coach@example.com" },
    update: { fullName: "Allie" },
    create: {
      email: "coach@example.com",
      passwordHash,
      fullName: "Allie",
      role: "COACH",
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: { fullName: "Sam" },
    create: {
      email: "student@example.com",
      passwordHash,
      fullName: "Sam",
      role: "STUDENT",
      remainingCredits: 3,
    },
  });

  await prisma.availability.createMany({
    data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      coachId: coach.id,
      dayOfWeek,
      startTime: "09:00",
      endTime: "21:00",
    })),
    skipDuplicates: true,
  });

  const trainerNames = ["Owen", "Carter", "Michelle", "Ojasvi"];
  const trainers = [];
  for (const name of trainerNames) {
    const trainer = await prisma.user.upsert({
      where: { email: `${name.toLowerCase()}@example.com` },
      update: {},
      create: {
        email: `${name.toLowerCase()}@example.com`,
        passwordHash,
        fullName: name,
        role: "COACH",
      },
    });
    trainers.push(trainer);

    await prisma.availability.createMany({
      data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        coachId: trainer.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
      })),
      skipDuplicates: true,
    });
  }

  console.log({
    admin: admin.email,
    coach: coach.email,
    student: student.email,
    trainers: trainers.map((t) => t.email),
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
