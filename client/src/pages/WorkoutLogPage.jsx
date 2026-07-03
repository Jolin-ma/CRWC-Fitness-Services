import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { todayISODate } from "../utils/date.js";

const emptyForm = { exercise: "", sets: "", reps: "", weight: "", recordedAt: todayISODate() };

export default function WorkoutLogPage() {
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    apiFetch("/workouts/mine", { token }).then(setEntries).catch((err) => setError(err.message));
  }

  async function addEntry(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch("/workouts", {
        method: "POST",
        token,
        body: {
          exercise: form.exercise,
          sets: Number(form.sets),
          reps: Number(form.reps),
          weight: form.weight ? Number(form.weight) : undefined,
          recordedAt: form.recordedAt,
        },
      });
      setForm({ ...emptyForm, recordedAt: form.recordedAt });
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entry) {
    setError("");
    try {
      await apiFetch(`/workouts/${entry.id}`, { method: "DELETE", token });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <DashboardLayout
      eyebrow="Client"
      title="Workout log"
      description="Track the exercises, sets, reps, and weight from your workouts."
    >
      <section className="border border-brand-ink/12 bg-white p-6">
        <h2 className="font-editorial text-xl text-brand-ink">Log a set</h2>

        <form onSubmit={addEntry} className="mt-4 flex flex-wrap items-end gap-3 border-b border-brand-ink/10 pb-5">
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Exercise
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bench press"
              value={form.exercise}
              onChange={(e) => setForm((prev) => ({ ...prev, exercise: e.target.value }))}
              className="w-full border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Sets
            </label>
            <input
              type="number"
              required
              min="1"
              value={form.sets}
              onChange={(e) => setForm((prev) => ({ ...prev, sets: e.target.value }))}
              className="w-16 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Reps
            </label>
            <input
              type="number"
              required
              min="1"
              value={form.reps}
              onChange={(e) => setForm((prev) => ({ ...prev, reps: e.target.value }))}
              className="w-16 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Weight (lbs)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="optional"
              value={form.weight}
              onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
              className="w-24 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Date
            </label>
            <input
              type="date"
              required
              max={todayISODate()}
              value={form.recordedAt}
              onChange={(e) => setForm((prev) => ({ ...prev, recordedAt: e.target.value }))}
              className="border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-green px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-green-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Log"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}

        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-ink/12 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-brand-ink/45">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Exercise</th>
              <th className="pb-2 font-medium">Sets × reps</th>
              <th className="pb-2 font-medium">Weight</th>
              <th className="pb-2 pr-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-brand-ink/55">
                  No workouts logged yet.
                </td>
              </tr>
            )}
            {entries.map((w) => (
              <tr key={w.id} className="border-b border-brand-ink/8 text-brand-ink last:border-b-0">
                <td className="py-2">{new Date(w.recordedAt).toLocaleDateString()}</td>
                <td className="py-2">{w.exercise}</td>
                <td className="py-2 font-mono">
                  {w.sets} × {w.reps}
                </td>
                <td className="py-2 font-mono">{w.weight != null ? `${w.weight} lbs` : "—"}</td>
                <td className="py-2 pr-3 text-right">
                  <button
                    onClick={() => deleteEntry(w)}
                    className="text-xs font-semibold uppercase tracking-wide text-brand-ink/40 hover:text-brand-red"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  );
}
