import Fastify from "fastify";
import cors from "@fastify/cors";

import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import bookingRoutes from "./routes/bookings.js";
import bodyStatsRoutes from "./routes/bodyStats.js";
import goalsRoutes from "./routes/goals.js";
import workoutsRoutes from "./routes/workouts.js";
import nutritionRoutes from "./routes/nutrition.js";
import waterRoutes from "./routes/water.js";
import { startReminderJob } from "./jobs/reminder.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(adminRoutes, { prefix: "/api/admin" });
  await app.register(bookingRoutes, { prefix: "/api/bookings" });
  await app.register(bodyStatsRoutes, { prefix: "/api/body-stats" });
  await app.register(goalsRoutes, { prefix: "/api/goals" });
  await app.register(workoutsRoutes, { prefix: "/api/workouts" });
  await app.register(nutritionRoutes, { prefix: "/api/nutrition" });
  await app.register(waterRoutes, { prefix: "/api/water" });

  app.get("/health", async () => ({ status: "ok" }));

  if (process.env.NODE_ENV !== "test") {
    startReminderJob(app);
  }

  return app;
}
