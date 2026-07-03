import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";
import StatTile from "../components/StatTile.jsx";
import { computeMilestones, computeStreakWeeks } from "../utils/progress.js";

export default function ProgressPage() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/bookings/mine", { token }).then(setBookings).catch((err) => setError(err.message));
  }, []);

  const streakWeeks = computeStreakWeeks(bookings);
  const { sessionMilestones, tenureMilestones, completedCount } = computeMilestones(
    bookings,
    user?.startDate,
  );
  const notes = bookings
    .filter((b) => b.status === "COMPLETED" && b.coachNotes)
    .sort((a, b) => new Date(b.sessionTime) - new Date(a.sessionTime));

  return (
    <DashboardLayout
      eyebrow="Client"
      title="My progress"
      description="Your streak, milestones, and notes from your personal trainer."
    >
      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        <StatTile
          label="Current streak"
          value={`${streakWeeks} wk${streakWeeks === 1 ? "" : "s"}`}
          tone="accent"
        />
        <StatTile label="Sessions completed" value={completedCount} />
        <StatTile
          label="Member since"
          value={user?.startDate ? new Date(user.startDate).toLocaleDateString() : "—"}
        />
      </div>

      <section className="mt-6 border border-brand-ink/12 bg-white p-6">
        <h2 className="font-editorial text-xl text-brand-ink">Milestones</h2>
        <p className="mt-1 text-xs text-brand-ink/45">Keep booking sessions to unlock the next one.</p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[...sessionMilestones, ...tenureMilestones].map((m) => (
            <div
              key={m.id}
              className={`border p-4 text-center ${
                m.achieved
                  ? "border-brand-green/30 bg-brand-green-soft text-brand-green"
                  : "border-brand-ink/12 bg-brand-paper text-brand-ink/35"
              }`}
            >
              <p className="font-editorial text-lg">{m.label}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide">
                {m.achieved ? "Unlocked" : "Locked"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 border border-brand-ink/12 bg-white p-6">
        <h2 className="font-editorial text-xl text-brand-ink">Progress notes</h2>
        <p className="mt-1 text-xs text-brand-ink/45">
          Notes your personal trainer left after completed sessions.
        </p>

        <ul className="mt-3 divide-y divide-brand-ink/10">
          {notes.length === 0 && (
            <li className="py-3 text-sm text-brand-ink/55">No progress notes yet.</li>
          )}
          {notes.map((b) => (
            <li key={b.id} className="py-3 text-sm text-brand-ink">
              <span className="font-mono text-brand-ink/50">
                {new Date(b.sessionTime).toLocaleDateString()}
              </span>{" "}
              with {b.coach.fullName}
              <p className="mt-1 text-brand-ink/70">{b.coachNotes}</p>
            </li>
          ))}
        </ul>
      </section>
    </DashboardLayout>
  );
}
