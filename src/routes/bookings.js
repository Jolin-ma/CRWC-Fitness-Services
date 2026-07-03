const SESSION_DURATION_MINUTES = 60;
const ACTIVE_STATUSES = ["SCHEDULED", "RESCHEDULED"];
const AVAILABILITY_START_HOUR = 9;
const AVAILABILITY_END_HOUR = 21;

const myAvailabilityQuerySchema = {
  querystring: {
    type: "object",
    properties: {
      dayOfWeek: { type: "string" },
      date: { type: "string" },
    },
  },
};

const myAvailabilityBodySchema = {
  body: {
    type: "object",
    required: ["hours"],
    properties: {
      dayOfWeek: { type: "integer", minimum: 0, maximum: 6 },
      date: { type: "string" },
      hours: { type: "array", items: { type: "integer" } },
    },
  },
};

const myAvailabilityDeleteSchema = {
  querystring: {
    type: "object",
    required: ["date"],
    properties: {
      date: { type: "string" },
    },
  },
};

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function mergeHoursToWindows(hours) {
  const sorted = [...new Set(hours)].sort((a, b) => a - b);
  const windows = [];

  for (const hour of sorted) {
    const last = windows[windows.length - 1];
    if (last && last.endHour === hour) {
      last.endHour = hour + 1;
    } else {
      windows.push({ startHour: hour, endHour: hour + 1 });
    }
  }

  return windows.map((w) => ({ startTime: formatHour(w.startHour), endTime: formatHour(w.endHour) }));
}

function parseDateOnly(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  if (!match) return null;
  const [, year, month, dayOfMonth] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(dayOfMonth));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function upcomingBookedHours(prisma, coachId, dayOfWeek) {
  const bookings = await prisma.booking.findMany({
    where: { coachId, status: { in: ACTIVE_STATUSES }, sessionTime: { gte: new Date() } },
    select: { sessionTime: true },
  });

  return new Set(
    bookings.filter((b) => b.sessionTime.getDay() === dayOfWeek).map((b) => b.sessionTime.getHours()),
  );
}

async function bookedHoursOnDate(prisma, coachId, dayStart) {
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const bookings = await prisma.booking.findMany({
    where: {
      coachId,
      status: { in: ACTIVE_STATUSES },
      sessionTime: { gte: dayStart, lt: dayEnd },
    },
    select: { sessionTime: true },
  });

  return new Set(bookings.map((b) => b.sessionTime.getHours()));
}

async function weeklyAvailableHours(prisma, coachId, dayOfWeek) {
  const windows = await prisma.availability.findMany({ where: { coachId, dayOfWeek } });
  const hours = new Set();
  for (const window of windows) {
    const [startHour] = window.startTime.split(":").map(Number);
    const [endHour] = window.endTime.split(":").map(Number);
    for (let h = startHour; h < endHour; h++) hours.add(h);
  }
  return hours;
}

const availableSlotsSchema = {
  querystring: {
    type: "object",
    required: ["coachId", "date"],
    properties: {
      coachId: { type: "string" },
      date: { type: "string" },
    },
  },
};

const bookSchema = {
  body: {
    type: "object",
    required: ["coachId", "sessionTime"],
    properties: {
      coachId: { type: "integer" },
      sessionTime: { type: "string" },
    },
  },
};

const resolveSchema = {
  body: {
    type: "object",
    required: ["bookingId", "status"],
    properties: {
      bookingId: { type: "integer" },
      status: { type: "string", enum: ["COMPLETED", "NO_SHOW", "RESCHEDULED"] },
      coachNotes: { type: "string" },
    },
  },
};

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export default async function bookingRoutes(app) {
  app.addHook("onRequest", app.authenticate);

  app.get("/coaches", async (request, reply) => {
    const coaches = await app.prisma.user.findMany({
      where: { role: "COACH" },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    });
    return reply.send(coaches);
  });

  app.get("/my-availability", { schema: myAvailabilityQuerySchema }, async (request, reply) => {
    if (request.user.role !== "COACH") {
      return reply.code(403).send({ error: "Only coaches can view their availability" });
    }

    if (request.query.date) {
      const dayStart = parseDateOnly(request.query.date);
      if (!dayStart) {
        return reply.code(400).send({ error: "Invalid date" });
      }
      const dayOfWeek = dayStart.getDay();

      const [override, weeklyHours, bookedHours] = await Promise.all([
        app.prisma.availabilityOverride.findUnique({
          where: { coachId_date: { coachId: request.user.id, date: dayStart } },
        }),
        weeklyAvailableHours(app.prisma, request.user.id, dayOfWeek),
        bookedHoursOnDate(app.prisma, request.user.id, dayStart),
      ]);

      const availableHours = override ? new Set(override.hours) : weeklyHours;
      const hours = [];
      for (let h = AVAILABILITY_START_HOUR; h <= AVAILABILITY_END_HOUR; h++) {
        hours.push({ hour: h, available: availableHours.has(h), booked: bookedHours.has(h) });
      }

      return reply.send({ date: dayStart.toISOString(), dayOfWeek, isCustomized: Boolean(override), hours });
    }

    const dayOfWeek = Number(request.query.dayOfWeek);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return reply.code(400).send({ error: "Invalid dayOfWeek" });
    }

    const [availableHours, bookedHours] = await Promise.all([
      weeklyAvailableHours(app.prisma, request.user.id, dayOfWeek),
      upcomingBookedHours(app.prisma, request.user.id, dayOfWeek),
    ]);

    const hours = [];
    for (let h = AVAILABILITY_START_HOUR; h <= AVAILABILITY_END_HOUR; h++) {
      hours.push({ hour: h, available: availableHours.has(h), booked: bookedHours.has(h) });
    }

    return reply.send({ dayOfWeek, hours });
  });

  app.put("/my-availability", { schema: myAvailabilityBodySchema }, async (request, reply) => {
    if (request.user.role !== "COACH") {
      return reply.code(403).send({ error: "Only coaches can update their availability" });
    }

    const { hours } = request.body;
    const hourSet = new Set(hours);

    if (request.body.date) {
      const dayStart = parseDateOnly(request.body.date);
      if (!dayStart) {
        return reply.code(400).send({ error: "Invalid date" });
      }

      const bookedHours = await bookedHoursOnDate(app.prisma, request.user.id, dayStart);
      const droppedBookedHour = [...bookedHours].find((h) => !hourSet.has(h));
      if (droppedBookedHour !== undefined) {
        return reply.code(409).send({
          error: `Cannot mark ${formatHour(droppedBookedHour)} unavailable — you have an upcoming booking then.`,
        });
      }

      const override = await app.prisma.availabilityOverride.upsert({
        where: { coachId_date: { coachId: request.user.id, date: dayStart } },
        update: { hours: [...hourSet].sort((a, b) => a - b) },
        create: { coachId: request.user.id, date: dayStart, hours: [...hourSet].sort((a, b) => a - b) },
      });

      const updatedHours = [];
      for (let h = AVAILABILITY_START_HOUR; h <= AVAILABILITY_END_HOUR; h++) {
        updatedHours.push({ hour: h, available: hourSet.has(h), booked: bookedHours.has(h) });
      }

      return reply.send({
        date: dayStart.toISOString(),
        dayOfWeek: dayStart.getDay(),
        isCustomized: true,
        hours: updatedHours,
        overrideId: override.id,
      });
    }

    const { dayOfWeek } = request.body;
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return reply.code(400).send({ error: "Invalid dayOfWeek" });
    }

    const bookedHours = await upcomingBookedHours(app.prisma, request.user.id, dayOfWeek);
    const droppedBookedHour = [...bookedHours].find((h) => !hourSet.has(h));
    if (droppedBookedHour !== undefined) {
      return reply.code(409).send({
        error: `Cannot mark ${formatHour(droppedBookedHour)} unavailable — you have an upcoming booking then.`,
      });
    }

    const windows = mergeHoursToWindows(hours);

    await app.prisma.$transaction([
      app.prisma.availability.deleteMany({ where: { coachId: request.user.id, dayOfWeek } }),
      ...windows.map((w) =>
        app.prisma.availability.create({
          data: { coachId: request.user.id, dayOfWeek, startTime: w.startTime, endTime: w.endTime },
        }),
      ),
    ]);

    const updatedHours = [];
    for (let h = AVAILABILITY_START_HOUR; h <= AVAILABILITY_END_HOUR; h++) {
      updatedHours.push({ hour: h, available: hourSet.has(h), booked: bookedHours.has(h) });
    }

    return reply.send({ dayOfWeek, hours: updatedHours });
  });

  app.delete("/my-availability", { schema: myAvailabilityDeleteSchema }, async (request, reply) => {
    if (request.user.role !== "COACH") {
      return reply.code(403).send({ error: "Only coaches can update their availability" });
    }

    const dayStart = parseDateOnly(request.query.date);
    if (!dayStart) {
      return reply.code(400).send({ error: "Invalid date" });
    }

    await app.prisma.availabilityOverride.deleteMany({
      where: { coachId: request.user.id, date: dayStart },
    });

    const dayOfWeek = dayStart.getDay();
    const [availableHours, bookedHours] = await Promise.all([
      weeklyAvailableHours(app.prisma, request.user.id, dayOfWeek),
      bookedHoursOnDate(app.prisma, request.user.id, dayStart),
    ]);

    const hours = [];
    for (let h = AVAILABILITY_START_HOUR; h <= AVAILABILITY_END_HOUR; h++) {
      hours.push({ hour: h, available: availableHours.has(h), booked: bookedHours.has(h) });
    }

    return reply.send({ date: dayStart.toISOString(), dayOfWeek, isCustomized: false, hours });
  });

  app.get("/available-slots", { schema: availableSlotsSchema }, async (request, reply) => {
    const coachId = Number(request.query.coachId);
    const dayStart = parseDateOnly(request.query.date);
    if (!dayStart) {
      return reply.code(400).send({ error: "Invalid date" });
    }
    const dayEnd = addMinutes(dayStart, 24 * 60);
    const dayOfWeek = dayStart.getDay();

    const [override, availabilities, bookings] = await Promise.all([
      app.prisma.availabilityOverride.findUnique({ where: { coachId_date: { coachId, date: dayStart } } }),
      app.prisma.availability.findMany({ where: { coachId, dayOfWeek } }),
      app.prisma.booking.findMany({
        where: {
          coachId,
          status: { in: ACTIVE_STATUSES },
          sessionTime: { gte: dayStart, lt: dayEnd },
        },
        select: { sessionTime: true },
      }),
    ]);

    const bookedTimes = new Set(bookings.map((b) => b.sessionTime.getTime()));

    const rangeWindows = override
      ? mergeHoursToWindows(override.hours)
      : availabilities.map((w) => ({ startTime: w.startTime, endTime: w.endTime }));

    const windows = rangeWindows.map((window) => {
      const [startHour, startMinute] = window.startTime.split(":").map(Number);
      const [endHour, endMinute] = window.endTime.split(":").map(Number);

      let cursor = new Date(dayStart);
      cursor.setHours(startHour, startMinute, 0, 0);
      const windowEnd = new Date(dayStart);
      windowEnd.setHours(endHour, endMinute, 0, 0);

      const blocks = [];
      while (addMinutes(cursor, SESSION_DURATION_MINUTES) <= windowEnd) {
        blocks.push({
          time: new Date(cursor).toISOString(),
          available: !bookedTimes.has(cursor.getTime()),
        });
        cursor = addMinutes(cursor, SESSION_DURATION_MINUTES);
      }

      return { startTime: window.startTime, endTime: window.endTime, blocks };
    });

    return reply.send({ coachId, date: dayStart.toISOString(), isCustomized: Boolean(override), windows });
  });

  app.post("/book", { schema: bookSchema }, async (request, reply) => {
    if (request.user.role !== "STUDENT") {
      return reply.code(403).send({ error: "Only students can book sessions" });
    }

    const { coachId, sessionTime } = request.body;
    const parsedTime = new Date(sessionTime);
    if (Number.isNaN(parsedTime.getTime())) {
      return reply.code(400).send({ error: "Invalid sessionTime" });
    }

    const coach = await app.prisma.user.findUnique({ where: { id: coachId } });
    if (!coach || coach.role !== "COACH") {
      return reply.code(404).send({ error: "Coach not found" });
    }

    try {
      const booking = await app.prisma.$transaction(async (tx) => {
        const student = await tx.user.findUnique({ where: { id: request.user.id } });
        if (student.remainingCredits <= 0) {
          throw new Error("NO_CREDITS");
        }

        const conflict = await tx.booking.findFirst({
          where: { coachId, sessionTime: parsedTime, status: { in: ACTIVE_STATUSES } },
        });
        if (conflict) {
          throw new Error("SLOT_TAKEN");
        }

        await tx.user.update({
          where: { id: student.id },
          data: { remainingCredits: { decrement: 1 } },
        });

        return tx.booking.create({
          data: {
            studentId: student.id,
            coachId,
            sessionTime: parsedTime,
            status: "SCHEDULED",
          },
        });
      });

      return reply.code(201).send(booking);
    } catch (err) {
      if (err.message === "NO_CREDITS") {
        return reply.code(402).send({ error: "No active session packages detected" });
      }
      if (err.message === "SLOT_TAKEN") {
        return reply.code(409).send({ error: "Slot is no longer available" });
      }
      throw err;
    }
  });

  app.patch("/resolve", { schema: resolveSchema }, async (request, reply) => {
    if (!["ADMIN", "COACH"].includes(request.user.role)) {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const { bookingId, status, coachNotes } = request.body;

    const booking = await app.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return reply.code(404).send({ error: "Booking not found" });
    }

    if (request.user.role === "COACH" && booking.coachId !== request.user.id) {
      return reply.code(403).send({ error: "Not your booking" });
    }

    if (status === "COMPLETED" && !coachNotes) {
      return reply.code(400).send({ error: "coachNotes is required to mark a session completed" });
    }

    const updated = await app.prisma.$transaction(async (tx) => {
      if (status === "RESCHEDULED") {
        await tx.user.update({
          where: { id: booking.studentId },
          data: { remainingCredits: { increment: 1 } },
        });
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: {
          status,
          coachNotes: status === "COMPLETED" ? coachNotes : booking.coachNotes,
        },
      });
    });

    return reply.send(updated);
  });

  app.get("/mine", async (request, reply) => {
    const where =
      request.user.role === "COACH"
        ? { coachId: request.user.id }
        : { studentId: request.user.id };

    const bookings = await app.prisma.booking.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        coach: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { sessionTime: "asc" },
    });

    return reply.send(bookings);
  });
}
