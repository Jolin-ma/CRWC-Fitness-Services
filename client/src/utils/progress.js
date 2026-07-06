function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Consecutive weeks (including this week or last week) with at least one completed
// session. A gap of more than one week resets the streak to 0.
export function computeStreakWeeks(bookings) {
  const completedWeeks = new Set(
    bookings.filter((b) => b.status === "COMPLETED").map((b) => isoWeekKey(new Date(b.sessionTime))),
  );

  const now = new Date();
  const currentKey = isoWeekKey(now);
  const lastWeekDate = new Date(now);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekKey = isoWeekKey(lastWeekDate);

  if (!completedWeeks.has(currentKey) && !completedWeeks.has(lastWeekKey)) {
    return 0;
  }

  let cursor = completedWeeks.has(currentKey) ? new Date(now) : lastWeekDate;
  let streak = 0;
  while (completedWeeks.has(isoWeekKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

const SESSION_MILESTONES = [1, 5, 10, 15, 20];

export function computeMilestones(bookings) {
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;

  const sessionMilestones = SESSION_MILESTONES.map((n) => ({
    id: `sessions-${n}`,
    label: `${n} session${n > 1 ? "s" : ""}`,
    achieved: completedCount >= n,
  }));

  return { sessionMilestones, completedCount };
}
