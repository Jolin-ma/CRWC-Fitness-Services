import fp from "fastify-plugin";
import jwt from "@fastify/jwt";

export default fp(async function authPlugin(app) {
  app.register(jwt, {
    secret: process.env.JWT_SECRET,
  });

  app.decorate("authenticate", async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: "Unauthorized" });
    }
  });

  app.decorate("requireRole", function requireRole(...roles) {
    return async function (request, reply) {
      if (!roles.includes(request.user?.role)) {
        reply.code(403).send({ error: "Forbidden" });
      }
    };
  });
});
