const createSchema = {
  body: {
    type: "object",
    required: ["food", "calories"],
    properties: {
      food: { type: "string", minLength: 1 },
      calories: { type: "integer", minimum: 0 },
      mealType: { type: "string", enum: ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] },
      protein: { type: "number", minimum: 0 },
      carbs: { type: "number", minimum: 0 },
      fat: { type: "number", minimum: 0 },
      recordedAt: { type: "string" },
      studentId: { type: "integer" },
    },
  },
};

export default async function nutritionRoutes(app) {
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

    const entry = await app.prisma.nutritionEntry.create({
      data: {
        studentId,
        loggedById: request.user.id,
        food: request.body.food,
        calories: request.body.calories,
        mealType: request.body.mealType || "SNACK",
        protein: request.body.protein ?? null,
        carbs: request.body.carbs ?? null,
        fat: request.body.fat ?? null,
        recordedAt,
      },
    });

    return reply.code(201).send(entry);
  });

  app.get("/mine", async (request, reply) => {
    if (request.user.role !== "STUDENT") {
      return reply.code(403).send({ error: "Only clients have a nutrition log" });
    }

    const entries = await app.prisma.nutritionEntry.findMany({
      where: { studentId: request.user.id },
      orderBy: { recordedAt: "desc" },
    });

    return reply.send(entries);
  });

  app.delete("/:id", async (request, reply) => {
    const entryId = Number(request.params.id);
    const entry = await app.prisma.nutritionEntry.findUnique({ where: { id: entryId } });
    if (!entry) {
      return reply.code(404).send({ error: "Nutrition entry not found" });
    }
    if (request.user.role === "STUDENT" && entry.studentId !== request.user.id) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    await app.prisma.nutritionEntry.delete({ where: { id: entryId } });
    return reply.code(204).send();
  });
}
