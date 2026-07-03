import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";
import StatTile from "../components/StatTile.jsx";
import AvailabilityTimeline from "../components/AvailabilityTimeline.jsx";
import { todayISODate } from "../utils/date.js";

export default function StudentDashboard() {
  const { token, user, updateCredits } = useAuth();
  const [coaches, setCoaches] = useState([]);
  const [coachId, setCoachId] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [windows, setWindows] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const locked = (user?.remainingCredits ?? 0) <= 0;
  const upcomingCount = myBookings.filter((b) => ["SCHEDULED", "RESCHEDULED"].includes(b.status)).length;
  const completedCount = myBookings.filter((b) => b.status === "COMPLETED").length;

  useEffect(() => {
    apiFetch("/bookings/coaches", { token }).then(setCoaches).catch((err) => setError(err.message));
    refreshBookings();
  }, []);

  useEffect(() => {
    if (!coachId || !date || locked) {
      setWindows([]);
      return;
    }
    apiFetch(`/bookings/available-slots?coachId=${coachId}&date=${date}`, { token })
      .then((data) => setWindows(data.windows))
      .catch((err) => setError(err.message));
  }, [coachId, date, locked]);

  function refreshBookings() {
    apiFetch("/bookings/mine", { token }).then(setMyBookings).catch(() => {});
  }

  async function book(time) {
    setMessage("");
    setError("");
    try {
      await apiFetch("/bookings/book", {
        method: "POST",
        token,
        body: { coachId: Number(coachId), sessionTime: time },
      });
      setMessage("Session booked. You'll get an email reminder 48 hours before it starts.");
      updateCredits((user.remainingCredits ?? 1) - 1);
      setWindows((prev) =>
        prev.map((w) => ({
          ...w,
          blocks: w.blocks.map((b) => (b.time === time ? { ...b, available: false } : b)),
        })),
      );
      refreshBookings();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <DashboardLayout
      eyebrow="Client"
      title={`Hi, ${user.fullName.split(" ")[0]}`}
      description={locked ? "No active session packages on file." : "Book your next session below."}
    >
      <div className="grid grid-cols-3 gap-4">
        <StatTile label="Sessions remaining" value={user.remainingCredits} tone="accent" />
        <StatTile label="Upcoming" value={upcomingCount} />
        <StatTile label="Completed" value={completedCount} />
      </div>

      {locked ? (
        <div className="mt-6 border border-amber-600/25 bg-amber-50 p-6 text-sm text-amber-900">
          No active session packages detected. Contact administration or complete payment
          verification to activate booking.
        </div>
      ) : (
        <div className="mt-6 border border-brand-ink/12 bg-white p-6">
          <h2 className="font-editorial text-xl text-brand-ink">Book a session</h2>
          <p className="mt-1 text-xs text-brand-ink/45">
            You and your personal trainer will get an email reminder 48 hours before the session.
          </p>
          <div className="mt-4 flex flex-wrap gap-6">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                Personal Trainer
              </label>
              <select
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
                className="border-b border-brand-ink/25 bg-transparent py-2 text-sm text-brand-ink outline-none focus:border-brand-green"
              >
                <option value="">Select a personal trainer</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-b border-brand-ink/25 bg-transparent py-2 text-sm text-brand-ink outline-none focus:border-brand-green"
              />
            </div>
          </div>

          {coachId ? (
            <div className="mt-6">
              <AvailabilityTimeline windows={windows} onSelect={book} />
            </div>
          ) : (
            <p className="mt-6 text-sm text-brand-ink/55">Pick a personal trainer to see their availability.</p>
          )}
        </div>
      )}

      {message && <p className="mt-4 text-sm text-brand-green">{message}</p>}
      {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}

      <div className="mt-8">
        <h2 className="mb-3 font-editorial text-xl text-brand-ink">My sessions</h2>
        <ul className="divide-y divide-brand-ink/10 border border-brand-ink/12 bg-white">
          {myBookings.length === 0 && <li className="p-5 text-sm text-brand-ink/55">No sessions yet.</li>}
          {myBookings.map((b) => (
            <li key={b.id} className="flex items-center justify-between p-5 text-sm text-brand-ink">
              <span>
                <span className="font-mono text-brand-ink/50">
                  {new Date(b.sessionTime).toLocaleString()}
                </span>{" "}
                with {b.coach.fullName}
              </span>
              <span className="border border-brand-green/25 bg-brand-green-soft px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-brand-green">
                {b.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}
