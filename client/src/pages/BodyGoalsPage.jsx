import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";
import WeightChart from "../components/WeightChart.jsx";
import { computeWeightGoalProgress } from "../utils/goals.js";
import { todayISODate } from "../utils/date.js";

const emptyGoalForm = { type: "WEIGHT", title: "", targetWeight: "", targetDate: "" };

export default function BodyGoalsPage() {
  const { token } = useAuth();
  const [bodyStats, setBodyStats] = useState([]);
  const [weightInput, setWeightInput] = useState("");
  const [weightDate, setWeightDate] = useState(todayISODate());
  const [goals, setGoals] = useState([]);
  const [goalForm, setGoalForm] = useState(emptyGoalForm);
  const [statsError, setStatsError] = useState("");
  const [goalsError, setGoalsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    refreshBodyStats();
    refreshGoals();
  }, []);

  function refreshBodyStats() {
    apiFetch("/body-stats/mine", { token }).then(setBodyStats).catch((err) => setStatsError(err.message));
  }

  function refreshGoals() {
    apiFetch("/goals/mine", { token }).then(setGoals).catch((err) => setGoalsError(err.message));
  }

  async function logWeight(e) {
    e.preventDefault();
    setStatsError("");
    setSaving(true);
    try {
      await apiFetch("/body-stats", {
        method: "POST",
        token,
        body: { weight: Number(weightInput), recordedAt: weightDate },
      });
      setWeightInput("");
      refreshBodyStats();
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addGoal(e) {
    e.preventDefault();
    setGoalsError("");
    setSavingGoal(true);
    try {
      await apiFetch("/goals", {
        method: "POST",
        token,
        body: {
          type: goalForm.type,
          title: goalForm.title,
          targetDate: goalForm.targetDate || undefined,
          targetWeight: goalForm.type === "WEIGHT" ? Number(goalForm.targetWeight) : undefined,
        },
      });
      setGoalForm(emptyGoalForm);
      refreshGoals();
    } catch (err) {
      setGoalsError(err.message);
    } finally {
      setSavingGoal(false);
    }
  }

  async function toggleGoal(goal) {
    setGoalsError("");
    try {
      await apiFetch(`/goals/${goal.id}`, {
        method: "PATCH",
        token,
        body: { completed: !goal.completed },
      });
      refreshGoals();
    } catch (err) {
      setGoalsError(err.message);
    }
  }

  async function deleteGoal(goal) {
    setGoalsError("");
    try {
      await apiFetch(`/goals/${goal.id}`, { method: "DELETE", token });
      refreshGoals();
    } catch (err) {
      setGoalsError(err.message);
    }
  }

  return (
    <DashboardLayout
      eyebrow="Client"
      title="Body & goals"
      description="Log your weight and track progress toward your targets."
    >
      <section className="border border-brand-ink/12 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-xl text-brand-ink">Body stats</h2>
            <p className="mt-1 text-xs text-brand-ink/45">Log your weight to track it over time.</p>
          </div>
          <form onSubmit={logWeight} className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                Date
              </label>
              <input
                type="date"
                required
                value={weightDate}
                max={todayISODate()}
                onChange={(e) => setWeightDate(e.target.value)}
                className="border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                Weight (lbs)
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-24 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
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
        </div>

        {statsError && <p className="mt-3 text-sm text-brand-red">{statsError}</p>}

        {bodyStats.length === 0 ? (
          <p className="mt-4 text-sm text-brand-ink/55">No weight entries yet. Log your first one above.</p>
        ) : (
          <>
            <div className="mt-5">
              <WeightChart entries={bodyStats} />
            </div>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-ink/12 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-brand-ink/45">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Weight</th>
                </tr>
              </thead>
              <tbody>
                {[...bodyStats].reverse().map((s) => (
                  <tr key={s.id} className="border-b border-brand-ink/8 text-brand-ink last:border-b-0">
                    <td className="py-2">{new Date(s.recordedAt).toLocaleDateString()}</td>
                    <td className="py-2 font-mono">{s.weight} lbs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="mt-6 border border-brand-ink/12 bg-white p-6">
        <h2 className="font-editorial text-xl text-brand-ink">Goals</h2>
        <p className="mt-1 text-xs text-brand-ink/45">
          Set a weight target (tracked automatically from your body stats) or any other goal.
        </p>

        <form onSubmit={addGoal} className="mt-4 flex flex-wrap items-end gap-3 border-b border-brand-ink/10 pb-5">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Type
            </label>
            <select
              value={goalForm.type}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, type: e.target.value }))}
              className="border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            >
              <option value="WEIGHT">Weight target</option>
              <option value="FREEFORM">Other goal</option>
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Title
            </label>
            <input
              type="text"
              required
              placeholder={goalForm.type === "WEIGHT" ? "Reach target weight" : "e.g. Bench 200 lbs"}
              value={goalForm.title}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
          </div>
          {goalForm.type === "WEIGHT" && (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                Target (lbs)
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.1"
                value={goalForm.targetWeight}
                onChange={(e) => setGoalForm((prev) => ({ ...prev, targetWeight: e.target.value }))}
                className="w-24 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Target date
            </label>
            <input
              type="date"
              value={goalForm.targetDate}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, targetDate: e.target.value }))}
              className="border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
          </div>
          <button
            type="submit"
            disabled={savingGoal}
            className="bg-brand-green px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-green-dark disabled:opacity-50"
          >
            {savingGoal ? "Saving…" : "Add goal"}
          </button>
        </form>

        {goalsError && <p className="mt-3 text-sm text-brand-red">{goalsError}</p>}

        <ul className="mt-4 space-y-3">
          {goals.length === 0 && <li className="text-sm text-brand-ink/55">No goals set yet.</li>}
          {goals.map((g) => {
            const weightProgress =
              g.type === "WEIGHT" ? computeWeightGoalProgress(g, bodyStats) : null;
            const achieved = g.type === "WEIGHT" ? weightProgress.achieved : g.completed;

            return (
              <li key={g.id} className="border border-brand-ink/12 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${achieved ? "text-brand-green" : "text-brand-ink"}`}>
                      {g.title}
                    </p>
                    <p className="mt-0.5 text-xs text-brand-ink/45">
                      {g.type === "WEIGHT"
                        ? `${weightProgress.currentWeight} → ${g.targetWeight} lbs`
                        : "Freeform goal"}
                      {g.targetDate && ` · by ${new Date(g.targetDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {g.type === "FREEFORM" && (
                      <button
                        onClick={() => toggleGoal(g)}
                        className={`border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                          g.completed
                            ? "border-brand-green/30 bg-brand-green-soft text-brand-green"
                            : "border-brand-ink/15 text-brand-ink/60 hover:bg-black/[0.03]"
                        }`}
                      >
                        {g.completed ? "Done" : "Mark done"}
                      </button>
                    )}
                    <button
                      onClick={() => deleteGoal(g)}
                      className="border border-brand-ink/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-ink/40 hover:bg-brand-red-soft hover:text-brand-red hover:border-brand-red/25"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {g.type === "WEIGHT" && (
                  <div className="mt-3 h-2 w-full bg-brand-paper">
                    <div
                      className={`h-2 ${achieved ? "bg-brand-green" : "bg-brand-green/60"}`}
                      style={{ width: `${Math.round(weightProgress.progress * 100)}%` }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </DashboardLayout>
  );
}
