import Fastify from "fastify";
import cors from "@fastify/cors";

import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import bookingRoutes from "./routes/bookings.js";
import { startReminderJob } from "./jobs/reminder.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(adminRoutes, { prefix: "/api/admin" });
  await app.register(bookingRoutes, { prefix: "/api/bookings" });

  app.get("/health", async () => ({ status: "ok" }));

  if (process.env.NODE_ENV !== "test") {
    startReminderJob(app);
  }

  return app;
}
