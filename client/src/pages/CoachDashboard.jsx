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
  const [weightDraft, setWeightDraft] = useState({});
  const [goalDraft, setGoalDraft] = useState({});
  const [workoutDraft, setWorkoutDraft] = useState({});
  const [nutritionDraft, setNutritionDraft] = useState({});
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

  async function logWeight(booking) {
    const weight = weightDraft[booking.id];
    if (!weight) return;
    setError("");
    setMessage("");
    try {
      await apiFetch("/body-stats", {
        method: "POST",
        token,
        body: { weight: Number(weight), studentId: booking.student.id },
      });
      setWeightDraft((prev) => ({ ...prev, [booking.id]: "" }));
      setMessage(`Logged ${booking.student.fullName}'s weight.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function setGoal(booking) {
    const title = goalDraft[booking.id];
    if (!title) return;
    setError("");
    setMessage("");
    try {
      await apiFetch("/goals", {
        method: "POST",
        token,
        body: { type: "FREEFORM", title, studentId: booking.student.id },
      });
      setGoalDraft((prev) => ({ ...prev, [booking.id]: "" }));
      setMessage(`Set a goal for ${booking.student.fullName}.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function logWorkout(booking) {
    const draft = workoutDraft[booking.id];
    if (!draft?.exercise || !draft?.sets || !draft?.reps) return;
    setError("");
    setMessage("");
    try {
      await apiFetch("/workouts", {
        method: "POST",
        token,
        body: {
          exercise: draft.exercise,
          sets: Number(draft.sets),
          reps: Number(draft.reps),
          studentId: booking.student.id,
        },
      });
      setWorkoutDraft((prev) => ({ ...prev, [booking.id]: { exercise: "", sets: "", reps: "" } }));
      setMessage(`Logged a set for ${booking.student.fullName}.`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function logNutrition(booking) {
    const draft = nutritionDraft[booking.id];
    if (!draft?.food || !draft?.calories) return;
    setError("");
    setMessage("");
    try {
      await apiFetch("/nutrition", {
        method: "POST",
        token,
        body: {
          food: draft.food,
          calories: Number(draft.calories),
          mealType: draft.mealType || "SNACK",
          studentId: booking.student.id,
        },
      });
      setNutritionDraft((prev) => ({
        ...prev,
        [booking.id]: { mealType: draft.mealType, food: "", calories: "" },
      }));
      setMessage(`Logged a meal for ${booking.student.fullName}.`);
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
              <div className="mt-3 flex items-end gap-2 border-t border-brand-ink/8 pt-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                    Log {b.student.fullName.split(" ")[0]}'s weight (lbs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={weightDraft[b.id] || ""}
                    onChange={(e) => setWeightDraft((prev) => ({ ...prev, [b.id]: e.target.value }))}
                    className="w-24 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
                  />
                </div>
                <button
                  onClick={() => logWeight(b)}
                  disabled={!weightDraft[b.id]}
                  className="border border-brand-ink/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-ink/60 hover:bg-brand-green hover:text-white hover:border-brand-green disabled:opacity-40"
                >
                  Log
                </button>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                    Set a goal for {b.student.fullName.split(" ")[0]}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bench 200 lbs"
                    value={goalDraft[b.id] || ""}
                    onChange={(e) => setGoalDraft((prev) => ({ ...prev, [b.id]: e.target.value }))}
                    className="w-full border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
                  />
                </div>
                <button
                  onClick={() => setGoal(b)}
                  disabled={!goalDraft[b.id]}
                  className="border border-brand-ink/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-ink/60 hover:bg-brand-green hover:text-white hover:border-brand-green disabled:opacity-40"
                >
                  Set goal
                </button>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                    Log a set for {b.student.fullName.split(" ")[0]}
                  </label>
                  <input
                    type="text"
                    placeholder="Exercise"
                    value={workoutDraft[b.id]?.exercise || ""}
                    onChange={(e) =>
                      setWorkoutDraft((prev) => ({
                        ...prev,
                        [b.id]: { ...prev[b.id], exercise: e.target.value },
                      }))
                    }
                    className="w-full border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
                  />
                </div>
                <input
                  type="number"
                  min="1"
                  placeholder="Sets"
                  value={workoutDraft[b.id]?.sets || ""}
                  onChange={(e) =>
                    setWorkoutDraft((prev) => ({ ...prev, [b.id]: { ...prev[b.id], sets: e.target.value } }))
                  }
                  className="w-16 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Reps"
                  value={workoutDraft[b.id]?.reps || ""}
                  onChange={(e) =>
                    setWorkoutDraft((prev) => ({ ...prev, [b.id]: { ...prev[b.id], reps: e.target.value } }))
                  }
                  className="w-16 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
                />
                <button
                  onClick={() => logWorkout(b)}
                  disabled={!workoutDraft[b.id]?.exercise || !workoutDraft[b.id]?.sets || !workoutDraft[b.id]?.reps}
                  className="border border-brand-ink/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-ink/60 hover:bg-brand-green hover:text-white hover:border-brand-green disabled:opacity-40"
                >
                  Log
                </button>
              </div>
              <div className="mt-3 flex items-end gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                    Log a meal for {b.student.fullName.split(" ")[0]}
                  </label>
                  <select
                    value={nutritionDraft[b.id]?.mealType || "SNACK"}
                    onChange={(e) =>
                      setNutritionDraft((prev) => ({
                        ...prev,
                        [b.id]: { ...prev[b.id], mealType: e.target.value },
                      }))
                    }
                    className="border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                    <option value="SNACK">Snack</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                    &nbsp;
                  </label>
                  <input
                    type="text"
                    placeholder="Food"
                    value={nutritionDraft[b.id]?.food || ""}
                    onChange={(e) =>
                      setNutritionDraft((prev) => ({
                        ...prev,
                        [b.id]: { ...prev[b.id], food: e.target.value },
                      }))
                    }
                    className="w-full border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
                  />
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="Calories"
                  value={nutritionDraft[b.id]?.calories || ""}
                  onChange={(e) =>
                    setNutritionDraft((prev) => ({
                      ...prev,
                      [b.id]: { ...prev[b.id], calories: e.target.value },
                    }))
                  }
                  className="w-24 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
                />
                <button
                  onClick={() => logNutrition(b)}
                  disabled={!nutritionDraft[b.id]?.food || !nutritionDraft[b.id]?.calories}
                  className="border border-brand-ink/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-ink/60 hover:bg-brand-green hover:text-white hover:border-brand-green disabled:opacity-40"
                >
                  Log
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
