import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";
import StatTile from "../components/StatTile.jsx";
import AvailabilityEditor from "../components/AvailabilityEditor.jsx";

export default function CoachDashboard() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [notesDraft, setNotesDraft] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    apiFetch("/bookings/mine", { token }).then(setBookings).catch((err) => setError(err.message));
  }

  async function resolve(bookingId, status) {
    setError("");
    setMessage("");
    const coachNotes = notesDraft[bookingId];

    if (status === "COMPLETED" && !coachNotes) {
      setError("Add progress notes before marking a session completed.");
      return;
    }

    try {
      await apiFetch("/bookings/resolve", {
        method: "PATCH",
        token,
        body: { bookingId, status, coachNotes },
      });
      setMessage("Session updated.");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const upcoming = bookings.filter((b) => b.status === "SCHEDULED" || b.status === "RESCHEDULED");
  const past = bookings.filter((b) => b.status === "COMPLETED" || b.status === "NO_SHOW");
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
  const noShowCount = bookings.filter((b) => b.status === "NO_SHOW").length;

  return (
    <DashboardLayout eyebrow="Personal Trainer" title="My schedule" description="Resolve sessions and log client progress.">
      <div className="grid grid-cols-3 gap-4">
        <StatTile label="Upcoming" value={upcoming.length} tone="accent" />
        <StatTile label="Completed" value={completedCount} />
        <StatTile label="No-shows" value={noShowCount} />
      </div>

      {message && <p className="mt-4 text-sm text-brand-green">{message}</p>}
      {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}

      <div className="mt-6">
        <AvailabilityEditor />
      </div>

      <section className="mt-8">
        <h2 className="font-editorial text-xl text-brand-ink">Upcoming sessions</h2>
        <p className="mb-3 mt-1 text-xs text-brand-ink/45">
          You and your client will get an email reminder 48 hours before each session.
        </p>
        <ul className="space-y-3">
          {upcoming.length === 0 && (
            <li className="border border-brand-ink/12 bg-white p-5 text-sm text-brand-ink/55">
              Nothing scheduled.
            </li>
          )}
          {upcoming.map((b) => (
            <li key={b.id} className="border border-brand-ink/12 bg-white p-5">
              <p className="text-sm font-semibold text-brand-ink">
                <span className="font-mono font-normal text-brand-ink/50">
                  {new Date(b.sessionTime).toLocaleString()}
                </span>{" "}
                with {b.student.fullName}
              </p>
              <textarea
                placeholder="Log client progress notes"
                value={notesDraft[b.id] || ""}
                onChange={(e) => setNotesDraft((prev) => ({ ...prev, [b.id]: e.target.value }))}
                className="mt-3 w-full border border-brand-ink/15 bg-transparent px-3.5 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-green"
                rows={2}
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => resolve(b.id, "COMPLETED")}
                  className="bg-brand-green px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-green-dark"
                >
                  Mark completed
                </button>
                <button
                  onClick={() => resolve(b.id, "NO_SHOW")}
                  className="bg-brand-red px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-red-dark"
                >
                  Mark no-show
                </button>
                <button
                  onClick={() => resolve(b.id, "RESCHEDULED")}
                  className="bg-brand-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-ink/85"
                >
                  Mark rescheduled
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-editorial text-xl text-brand-ink">History</h2>
        <ul className="divide-y divide-brand-ink/10 border border-brand-ink/12 bg-white">
          {past.length === 0 && <li className="p-5 text-sm text-brand-ink/55">No resolved sessions yet.</li>}
          {past.map((b) => (
            <li key={b.id} className="p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-brand-ink">
                  <span className="font-mono text-brand-ink/50">
                    {new Date(b.sessionTime).toLocaleString()}
                  </span>{" "}
                  with {b.student.fullName}
                </span>
                <span className="border border-brand-green/25 bg-brand-green-soft px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-brand-green">
                  {b.status}
                </span>
              </div>
              {b.coachNotes && <p className="mt-2 text-brand-ink/55">{b.coachNotes}</p>}
            </li>
          ))}
        </ul>
      </section>
    </DashboardLayout>
  );
}
