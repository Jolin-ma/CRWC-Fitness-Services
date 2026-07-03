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
