import bcrypt from "bcryptjs";

const registerSchema = {
  body: {
    type: "object",
    required: ["email", "password", "fullName"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
      fullName: { type: "string", minLength: 1 },
      role: { type: "string", enum: ["STUDENT", "COACH", "ADMIN"] },
    },
  },
};

const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
};

export default async function authRoutes(app) {
  app.post("/register", { schema: registerSchema }, async (request, reply) => {
    const { email, password, fullName, role } = request.body;

    const existing = await app.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const resolvedRole = role || "STUDENT";
    const user = await app.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: resolvedRole,
        startDate: resolvedRole === "STUDENT" ? new Date() : undefined,
      },
    });

    const token = app.jwt.sign({ id: user.id, role: user.role });
    return reply.code(201).send({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        remainingCredits: user.remainingCredits,
        startDate: user.startDate,
      },
    });
  });

  app.post("/login", { schema: loginSchema }, async (request, reply) => {
    const { email, password } = request.body;

    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const token = app.jwt.sign({ id: user.id, role: user.role });
    return reply.send({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        remainingCredits: user.remainingCredits,
        startDate: user.startDate,
      },
    });
  });
}
