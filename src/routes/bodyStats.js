const createSchema = {
  body: {
    type: "object",
    required: ["weight"],
    properties: {
      weight: { type: "number", exclusiveMinimum: 0 },
      recordedAt: { type: "string" },
      studentId: { type: "integer" },
    },
  },
};

export default async function bodyStatsRoutes(app) {
  app.addHook("onRequest", app.authenticate);
  app.addHook("onRequest", app.requireRole("STUDENT", "COACH"));

  app.post("/", { schema: createSchema }, async (request, reply) => {
    let studentId;

    if (request.user.role === "STUDENT") {
      studentId = request.user.id;
    } else {
      studentId = request.body.studentId;
      if (!studentId) {
        return reply.code(400).send({ error: "studentId is required" });
      }
      const student = await app.prisma.user.findUnique({ where: { id: studentId } });
      if (!student || student.role !== "STUDENT") {
        return reply.code(404).send({ error: "Student not found" });
      }
    }

    const recordedAt = request.body.recordedAt ? new Date(request.body.recordedAt) : new Date();
    if (Number.isNaN(recordedAt.getTime())) {
      return reply.code(400).send({ error: "Invalid recordedAt" });
    }

    const entry = await app.prisma.bodyStat.create({
      data: {
        studentId,
        weight: request.body.weight,
        loggedById: request.user.id,
        recordedAt,
      },
    });

    return reply.code(201).send(entry);
  });

  app.get("/mine", async (request, reply) => {
    if (request.user.role !== "STUDENT") {
      return reply.code(403).send({ error: "Only clients have a body stats log" });
    }

    const entries = await app.prisma.bodyStat.findMany({
      where: { studentId: request.user.id },
      orderBy: { recordedAt: "asc" },
    });

    return reply.send(entries);
  });
}
