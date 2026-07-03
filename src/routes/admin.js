// Cycles run Sept 1 - Aug 31, labeled by the starting year, e.g. "2025-26".
function cycleLabelFor(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth(); // 0 = Jan ... 8 = Sep
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

function cycleRangeFor(label) {
  const startYear = Number(label.split("-")[0]);
  if (!Number.isInteger(startYear)) return null;
  return {
    start: new Date(Date.UTC(startYear, 8, 1, 0, 0, 0)),
    end: new Date(Date.UTC(startYear + 1, 7, 31, 23, 59, 59, 999)),
  };
}

const creditsSchema = {
  body: {
    type: "object",
    required: ["studentId", "creditAdjustment"],
    properties: {
      studentId: { type: "integer" },
      creditAdjustment: { type: "integer" },
    },
  },
};

const startDateSchema = {
  body: {
    type: "object",
    required: ["startDate"],
    properties: {
      startDate: { type: "string" },
    },
  },
};

const availabilitySchema = {
  body: {
    type: "object",
    required: ["coachId", "dayOfWeek", "startTime", "endTime"],
    properties: {
      coachId: { type: "integer" },
      dayOfWeek: { type: "integer", minimum: 0, maximum: 6 },
      startTime: { type: "string" },
      endTime: { type: "string" },
    },
  },
};

export default async function adminRoutes(app) {
  app.addHook("onRequest", app.authenticate);
  app.addHook("onRequest", app.requireRole("ADMIN"));

  // Manual credit overrides — look up a student by email or adjust by id.
  app.patch("/credits", { schema: creditsSchema }, async (request, reply) => {
    const { studentId, creditAdjustment } = request.body;

    const student = await app.prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== "STUDENT") {
      return reply.code(404).send({ error: "Student not found" });
    }

    const updated = await app.prisma.user.update({
      where: { id: studentId },
      data: { remainingCredits: { increment: creditAdjustment } },
    });

    return reply.send({
      id: updated.id,
      email: updated.email,
      remainingCredits: updated.remainingCredits,
    });
  });

  app.get("/students", async (request, reply) => {
    const students = await app.prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, email: true, fullName: true, remainingCredits: true, startDate: true },
      orderBy: { fullName: "asc" },
    });
    return reply.send(students);
  });

  app.patch("/students/:id/start-date", { schema: startDateSchema }, async (request, reply) => {
    const studentId = Number(request.params.id);
    const startDate = new Date(request.body.startDate);
    if (Number.isNaN(startDate.getTime())) {
      return reply.code(400).send({ error: "Invalid start date" });
    }

    const student = await app.prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== "STUDENT") {
      return reply.code(404).send({ error: "Student not found" });
    }

    const updated = await app.prisma.user.update({
      where: { id: studentId },
      data: { startDate },
    });

    return reply.send({ id: updated.id, startDate: updated.startDate });
  });

  app.post("/coaches/availability", { schema: availabilitySchema }, async (request, reply) => {
    const { coachId, dayOfWeek, startTime, endTime } = request.body;

    const coach = await app.prisma.user.findUnique({ where: { id: coachId } });
    if (!coach || coach.role !== "COACH") {
      return reply.code(404).send({ error: "Coach not found" });
    }

    const availability = await app.prisma.availability.create({
      data: { coachId, dayOfWeek, startTime, endTime },
    });

    return reply.code(201).send(availability);
  });

  app.get("/students/:id/bookings", async (request, reply) => {
    const studentId = Number(request.params.id);

    const student = await app.prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, fullName: true, email: true, remainingCredits: true, startDate: true, role: true },
    });
    if (!student || student.role !== "STUDENT") {
      return reply.code(404).send({ error: "Student not found" });
    }

    const bookings = await app.prisma.booking.findMany({
      where: { studentId },
      include: { coach: { select: { id: true, fullName: true } } },
      orderBy: { sessionTime: "desc" },
    });

    return reply.send({
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        remainingCredits: student.remainingCredits,
        startDate: student.startDate,
      },
      bookings,
    });
  });

  app.get("/cycles", async (request, reply) => {
    const bookings = await app.prisma.booking.findMany({
      select: { studentId: true, sessionTime: true },
    });

    const cycles = new Map();
    for (const b of bookings) {
      const label = cycleLabelFor(b.sessionTime);
      if (!cycles.has(label)) cycles.set(label, new Set());
      cycles.get(label).add(b.studentId);
    }

    const result = [...cycles.entries()]
      .map(([label, studentIds]) => ({ label, clientCount: studentIds.size }))
      .sort((a, b) => b.label.localeCompare(a.label));

    return reply.send(result);
  });

  app.get("/cycles/:label/clients", async (request, reply) => {
    const range = cycleRangeFor(request.params.label);
    if (!range) {
      return reply.code(400).send({ error: "Invalid cycle label" });
    }

    const bookings = await app.prisma.booking.findMany({
      where: { sessionTime: { gte: range.start, lte: range.end } },
      select: { studentId: true },
      distinct: ["studentId"],
    });

    const clients = await app.prisma.user.findMany({
      where: { id: { in: bookings.map((b) => b.studentId) } },
      select: { id: true, fullName: true, email: true, remainingCredits: true },
      orderBy: { fullName: "asc" },
    });

    return reply.send({ label: request.params.label, clients });
  });

  app.get("/calendar", async (request, reply) => {
    const bookings = await app.prisma.booking.findMany({
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        coach: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { sessionTime: "asc" },
    });
    return reply.send(bookings);
  });
}
