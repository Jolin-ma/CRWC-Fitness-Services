import cron from "node-cron";
import { sendEmail, sessionReminderEmail } from "../services/email.js";

/**
 * Every hour, sweep for SCHEDULED bookings landing in the 47-48h window
 * and fire a reminder to both student and coach exactly once.
 */
export function startReminderJob(app) {
  const task = cron.schedule("0 * * * *", () => runReminderSweep(app));
  app.addHook("onClose", () => task.stop());
  return task;
}

export async function runReminderSweep(app) {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 47 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const dueBookings = await app.prisma.booking.findMany({
    where: {
      status: "SCHEDULED",
      reminderSent: false,
      sessionTime: { gt: windowStart, lte: windowEnd },
    },
    include: { student: true, coach: true },
  });

  for (const booking of dueBookings) {
    const studentEmail = sessionReminderEmail({
      recipientName: booking.student.fullName,
      otherPartyName: booking.coach.fullName,
      sessionTime: booking.sessionTime,
    });
    const coachEmail = sessionReminderEmail({
      recipientName: booking.coach.fullName,
      otherPartyName: booking.student.fullName,
      sessionTime: booking.sessionTime,
    });

    await Promise.all([
      sendEmail({ to: booking.student.email, ...studentEmail }),
      sendEmail({ to: booking.coach.email, ...coachEmail }),
    ]);

    await app.prisma.booking.update({
      where: { id: booking.id },
      data: { reminderSent: true },
    });
  }

  return dueBookings.length;
}
