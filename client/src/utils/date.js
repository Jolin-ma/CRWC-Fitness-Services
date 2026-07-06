// Local calendar date as YYYY-MM-DD. Deliberately avoids toISOString(),
// which converts to UTC and can land on the wrong day for timezones behind UTC.
export function todayISODate() {
  return toISODate(new Date());
}

export function toISODate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Recovers the calendar date (YYYY-MM-DD) a date-only value like "2026-07-06" was
// meant to represent. Date-only strings are parsed as UTC midnight by `Date`, so
// reading them back with local getters (getFullYear/getMonth/getDate) can roll
// them back a day in timezones behind UTC. Use UTC getters instead.
export function recordedISODate(value) {
  const d = new Date(value);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatRecordedDate(value) {
  const d = new Date(value);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString();
}
