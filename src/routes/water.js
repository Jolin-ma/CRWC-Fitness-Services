const createSchema = {
  body: {
    type: "object",
    required: ["ounces"],
    properties: {
      ounces: { type: "integer", exclusiveMinimum: 0 },
      recordedAt: { type: "string" },
      studentId: { type: "integer" },
    },
  },
};

export default async function waterRoutes(app) {
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

    const entry = await app.prisma.waterEntry.create({
      data: {
        studentId,
        loggedById: request.user.id,
        ounces: request.body.ounces,
        recordedAt,
      },
    });

    return reply.code(201).send(entry);
  });

  app.get("/mine", async (request, reply) => {
    if (request.user.role !== "STUDENT") {
      return reply.code(403).send({ error: "Only clients have a water log" });
    }

    const entries = await app.prisma.waterEntry.findMany({
      where: { studentId: request.user.id },
      orderBy: { recordedAt: "desc" },
    });

    return reply.send(entries);
  });

  app.delete("/:id", async (request, reply) => {
    const entryId = Number(request.params.id);
    const entry = await app.prisma.waterEntry.findUnique({ where: { id: entryId } });
    if (!entry) {
      return reply.code(404).send({ error: "Water entry not found" });
    }
    if (request.user.role === "STUDENT" && entry.studentId !== request.user.id) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    await app.prisma.waterEntry.delete({ where: { id: entryId } });
    return reply.code(204).send();
  });
}
