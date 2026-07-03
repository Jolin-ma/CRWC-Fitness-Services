import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { todayISODate } from "../utils/date.js";

const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

function formatHour(hour) {
  return new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: "numeric" });
}

export default function AvailabilityEditor() {
  const { token } = useAuth();
  const [mode, setMode] = useState("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [date, setDate] = useState(todayISODate());
  const [hours, setHours] = useState([]);
  const [savedHours, setSavedHours] = useState([]);
  const [isCustomized, setIsCustomized] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMessage("");
    setError("");
    const query = mode === "weekly" ? `dayOfWeek=${dayOfWeek}` : `date=${date}`;
    apiFetch(`/bookings/my-availability?${query}`, { token })
      .then((data) => {
        setHours(data.hours);
        setSavedHours(data.hours);
        setIsCustomized(Boolean(data.isCustomized));
        setDirty(false);
      })
      .catch((err) => setError(err.message));
  }, [mode, dayOfWeek, date]);

  function toggle(hour) {
    setHours((prev) =>
      prev.map((h) => (h.hour === hour && !h.booked ? { ...h, available: !h.available } : h)),
    );
    setDirty(true);
    setMessage("");
  }

  function discardChanges() {
    setHours(savedHours);
    setDirty(false);
    setMessage("");
    setError("");
  }

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const selected = hours.filter((h) => h.available).map((h) => h.hour);
      const body = mode === "weekly" ? { dayOfWeek, hours: selected } : { date, hours: selected };
      const data = await apiFetch("/bookings/my-availability", { method: "PUT", token, body });
      setHours(data.hours);
      setSavedHours(data.hours);
      setIsCustomized(Boolean(data.isCustomized));
      setDirty(false);
      setMessage("Availability saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function resetDate() {
    setDate(todayISODate());
    setMessage("");
    setError("");
  }

  return (
    <div className="border border-brand-ink/12 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-editorial text-xl text-brand-ink">Availability</h2>
        <div className="flex items-center gap-2">
          {dirty && (
            <>
              <button
                onClick={discardChanges}
                disabled={saving}
                className="border border-brand-ink/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-ink/60 hover:bg-black/[0.03] disabled:opacity-50"
              >
                Discard changes
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="bg-brand-green px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-green-dark disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </>
          )}
        </div>
      </div>
      <p className="mt-1 text-sm text-brand-ink/55">
        Click hours to toggle when you're open for bookings. Hours with an upcoming session can't
        be turned off.
      </p>

      <div className="mt-4 flex w-fit border border-brand-ink/15">
        <button
          onClick={() => setMode("weekly")}
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
            mode === "weekly" ? "bg-brand-ink text-white" : "text-brand-ink/55 hover:bg-black/[0.03]"
          }`}
        >
          Weekly pattern
        </button>
        <button
          onClick={() => setMode("date")}
          className={`border-l border-brand-ink/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
            mode === "date" ? "bg-brand-ink text-white" : "text-brand-ink/55 hover:bg-black/[0.03]"
          }`}
        >
          Specific date
        </button>
      </div>

      {mode === "weekly" ? (
        <div className="mt-4 flex gap-1.5">
          {DAYS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDayOfWeek(d.value)}
              className={`px-3 py-1.5 text-xs font-semibold ${
                dayOfWeek === d.value
                  ? "bg-brand-ink text-white"
                  : "border border-brand-ink/15 text-brand-ink/60 hover:bg-black/[0.03]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <input
            type="date"
            value={date}
            min={todayISODate()}
            onChange={(e) => setDate(e.target.value)}
            className="border-b border-brand-ink/25 bg-transparent px-1 py-2 text-sm text-brand-ink outline-none focus:border-brand-green"
          />
          {date !== todayISODate() && (
            <button
              onClick={resetDate}
              title="Picked the wrong date? Jump back to today"
              className="border border-brand-ink/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-ink/60 hover:bg-black/[0.03]"
            >
              Reset date
            </button>
          )}
          {isCustomized ? (
            <span className="border border-brand-green/30 bg-brand-green-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-green">
              Customized
            </span>
          ) : (
            <span className="text-xs text-brand-ink/40">Following your weekly pattern</span>
          )}
        </div>
      )}

      <div className="mt-5 flex border border-brand-ink/12">
        {hours.map((h) => (
          <button
            key={h.hour}
            type="button"
            onClick={() => toggle(h.hour)}
            disabled={h.booked}
            title={h.booked ? `${formatHour(h.hour)} — booked, can't disable` : formatHour(h.hour)}
            className={`group relative h-14 flex-1 border-r border-brand-ink/12 last:border-r-0 transition-colors ${
              h.booked
                ? "cursor-not-allowed bg-brand-green-soft"
                : h.available
                  ? "cursor-pointer bg-brand-green hover:bg-brand-green-dark"
                  : "cursor-pointer bg-black/[0.03] hover:bg-black/[0.06]"
            }`}
          >
            <span
              className={`pointer-events-none absolute inset-x-0 bottom-1.5 text-center font-mono text-[10px] ${
                h.available ? "text-white" : h.booked ? "text-brand-green" : "text-brand-ink/50"
              }`}
            >
              {formatHour(h.hour)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-brand-ink/45">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-brand-green" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-black/[0.06]" /> Off
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 bg-brand-green-soft" /> Booked
        </span>
      </div>

      {message && <p className="mt-3 text-sm text-brand-green">{message}</p>}
      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}
    </div>
  );
}
