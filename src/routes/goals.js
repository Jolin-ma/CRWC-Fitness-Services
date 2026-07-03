const createSchema = {
  body: {
    type: "object",
    required: ["type", "title"],
    properties: {
      type: { type: "string", enum: ["WEIGHT", "FREEFORM"] },
      title: { type: "string", minLength: 1 },
      targetWeight: { type: "number", exclusiveMinimum: 0 },
      targetDate: { type: "string" },
      studentId: { type: "integer" },
    },
  },
};

const updateSchema = {
  body: {
    type: "object",
    properties: {
      completed: { type: "boolean" },
    },
  },
};

export default async function goalsRoutes(app) {
  app.addHook("onRequest", app.authenticate);
  app.addHook("onRequest", app.requireRole("STUDENT", "COACH"));

  app.post("/", { schema: createSchema }, async (request, reply) => {
    const { type, title, targetWeight, targetDate } = request.body;

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

    let startingWeight = null;
    if (type === "WEIGHT") {
      if (targetWeight === undefined) {
        return reply.code(400).send({ error: "targetWeight is required for a weight goal" });
      }
      const latest = await app.prisma.bodyStat.findFirst({
        where: { studentId },
        orderBy: { recordedAt: "desc" },
      });
      if (!latest) {
        return reply.code(400).send({ error: "Log a weight entry before setting a weight goal" });
      }
      startingWeight = latest.weight;
    }

    const parsedDate = targetDate ? new Date(targetDate) : null;
    if (parsedDate && Number.isNaN(parsedDate.getTime())) {
      return reply.code(400).send({ error: "Invalid targetDate" });
    }

    const goal = await app.prisma.goal.create({
      data: {
        studentId,
        createdById: request.user.id,
        type,
        title,
        targetWeight: type === "WEIGHT" ? targetWeight : null,
        startingWeight,
        targetDate: parsedDate,
      },
    });

    return reply.code(201).send(goal);
  });

  app.get("/mine", async (request, reply) => {
    if (request.user.role !== "STUDENT") {
      return reply.code(403).send({ error: "Only clients have a goal list" });
    }

    const goals = await app.prisma.goal.findMany({
      where: { studentId: request.user.id },
      orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
    });

    return reply.send(goals);
  });

  app.patch("/:id", { schema: updateSchema }, async (request, reply) => {
    const goalId = Number(request.params.id);
    const goal = await app.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) {
      return reply.code(404).send({ error: "Goal not found" });
    }
    if (request.user.role === "STUDENT" && goal.studentId !== request.user.id) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const { completed } = request.body;
    const updated = await app.prisma.goal.update({
      where: { id: goalId },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    return reply.send(updated);
  });

  app.delete("/:id", async (request, reply) => {
    const goalId = Number(request.params.id);
    const goal = await app.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) {
      return reply.code(404).send({ error: "Goal not found" });
    }
    if (request.user.role === "STUDENT" && goal.studentId !== request.user.id) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    await app.prisma.goal.delete({ where: { id: goalId } });
    return reply.code(204).send();
  });
}
