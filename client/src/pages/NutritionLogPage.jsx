import { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";
import StatTile from "../components/StatTile.jsx";
import { todayISODate } from "../utils/date.js";

const MEAL_TYPES = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "SNACK", label: "Snack" },
];

const WATER_PRESETS = [8, 12, 16, 24];

const emptyForm = {
  food: "",
  mealType: "BREAKFAST",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  recordedAt: todayISODate(),
};

function sum(entries, field) {
  return entries.reduce((total, e) => total + (e[field] || 0), 0);
}

function isToday(dateValue) {
  return new Date(dateValue).toLocaleDateString() === new Date().toLocaleDateString();
}

export default function NutritionLogPage() {
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [waterEntries, setWaterEntries] = useState([]);
  const [waterAmount, setWaterAmount] = useState("");
  const [waterError, setWaterError] = useState("");
  const [savingWater, setSavingWater] = useState(false);

  useEffect(() => {
    refresh();
    refreshWater();
  }, []);

  function refresh() {
    apiFetch("/nutrition/mine", { token }).then(setEntries).catch((err) => setError(err.message));
  }

  function refreshWater() {
    apiFetch("/water/mine", { token }).then(setWaterEntries).catch((err) => setWaterError(err.message));
  }

  async function addEntry(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch("/nutrition", {
        method: "POST",
        token,
        body: {
          food: form.food,
          mealType: form.mealType,
          calories: Number(form.calories),
          protein: form.protein ? Number(form.protein) : undefined,
          carbs: form.carbs ? Number(form.carbs) : undefined,
          fat: form.fat ? Number(form.fat) : undefined,
          recordedAt: form.recordedAt,
        },
      });
      setForm({ ...emptyForm, mealType: form.mealType, recordedAt: form.recordedAt });
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
      await apiFetch(`/nutrition/${entry.id}`, { method: "DELETE", token });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function logWater(ounces) {
    setWaterError("");
    setSavingWater(true);
    try {
      await apiFetch("/water", { method: "POST", token, body: { ounces } });
      setWaterAmount("");
      refreshWater();
    } catch (err) {
      setWaterError(err.message);
    } finally {
      setSavingWater(false);
    }
  }

  async function deleteWater(entry) {
    setWaterError("");
    try {
      await apiFetch(`/water/${entry.id}`, { method: "DELETE", token });
      refreshWater();
    } catch (err) {
      setWaterError(err.message);
    }
  }

  const todayEntries = entries.filter((e) => isToday(e.recordedAt));
  const todayWater = waterEntries.filter((w) => isToday(w.recordedAt));
  const waterTotal = sum(todayWater, "ounces");

  return (
    <DashboardLayout
      eyebrow="Client"
      title="Nutrition"
      description="Log meals by type, track calories and macros, and stay on top of water intake."
    >
      <div className="grid grid-cols-5 gap-4">
        <StatTile label="Calories today" value={sum(todayEntries, "calories")} tone="accent" />
        <StatTile label="Protein (g)" value={Math.round(sum(todayEntries, "protein"))} />
        <StatTile label="Carbs (g)" value={Math.round(sum(todayEntries, "carbs"))} />
        <StatTile label="Fat (g)" value={Math.round(sum(todayEntries, "fat"))} />
        <StatTile label="Water (oz)" value={waterTotal} />
      </div>

      <section className="mt-6 border border-brand-ink/12 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-xl text-brand-ink">Today's meals</h2>
          <p className="font-mono text-sm font-semibold text-brand-green">
            {sum(todayEntries, "calories")} cal total
          </p>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {MEAL_TYPES.map((m) => {
            const items = todayEntries.filter((e) => e.mealType === m.value);
            return (
              <div key={m.value} className="border border-brand-ink/12 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-editorial text-sm text-brand-ink">{m.label}</p>
                  <p className="font-mono text-[11px] text-brand-ink/45">{sum(items, "calories")} cal</p>
                </div>
                <ul className="mt-2 space-y-1">
                  {items.length === 0 && <li className="text-xs text-brand-ink/40">Nothing logged</li>}
                  {items.map((n) => (
                    <li key={n.id} className="flex items-center justify-between text-xs text-brand-ink/70">
                      <span className="truncate">{n.food}</span>
                      <button
                        onClick={() => deleteEntry(n)}
                        className="ml-2 shrink-0 text-brand-ink/30 hover:text-brand-red"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 border border-brand-ink/12 bg-white p-6">
        <h2 className="font-editorial text-xl text-brand-ink">Log a meal</h2>

        <form onSubmit={addEntry} className="mt-4 flex flex-wrap items-end gap-3 border-b border-brand-ink/10 pb-5">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Meal
            </label>
            <select
              value={form.mealType}
              onChange={(e) => setForm((prev) => ({ ...prev, mealType: e.target.value }))}
              className="border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            >
              {MEAL_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Food
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chicken breast"
              value={form.food}
              onChange={(e) => setForm((prev) => ({ ...prev, food: e.target.value }))}
              className="w-full border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Calories
            </label>
            <input
              type="number"
              required
              min="0"
              value={form.calories}
              onChange={(e) => setForm((prev) => ({ ...prev, calories: e.target.value }))}
              className="w-20 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Protein (g)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="optional"
              value={form.protein}
              onChange={(e) => setForm((prev) => ({ ...prev, protein: e.target.value }))}
              className="w-20 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Carbs (g)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="optional"
              value={form.carbs}
              onChange={(e) => setForm((prev) => ({ ...prev, carbs: e.target.value }))}
              className="w-20 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
              Fat (g)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="optional"
              value={form.fat}
              onChange={(e) => setForm((prev) => ({ ...prev, fat: e.target.value }))}
              className="w-20 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
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
              <th className="pb-2 font-medium">Meal</th>
              <th className="pb-2 font-medium">Food</th>
              <th className="pb-2 font-medium">Cal</th>
              <th className="pb-2 font-medium">P / C / F</th>
              <th className="pb-2 pr-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-brand-ink/55">
                  No meals logged yet.
                </td>
              </tr>
            )}
            {entries.map((n) => (
              <tr key={n.id} className="border-b border-brand-ink/8 text-brand-ink last:border-b-0">
                <td className="py-2">{new Date(n.recordedAt).toLocaleDateString()}</td>
                <td className="py-2 text-brand-ink/60">
                  {MEAL_TYPES.find((m) => m.value === n.mealType)?.label || n.mealType}
                </td>
                <td className="py-2">{n.food}</td>
                <td className="py-2 font-mono">{n.calories}</td>
                <td className="py-2 font-mono text-brand-ink/60">
                  {n.protein ?? "—"} / {n.carbs ?? "—"} / {n.fat ?? "—"}
                </td>
                <td className="py-2 pr-3 text-right">
                  <button
                    onClick={() => deleteEntry(n)}
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

      <section className="mt-6 border border-brand-ink/12 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-editorial text-xl text-brand-ink">Water intake</h2>
            <p className="mt-1 text-xs text-brand-ink/45">{waterTotal} oz logged today.</p>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex gap-1.5">
              {WATER_PRESETS.map((oz) => (
                <button
                  key={oz}
                  type="button"
                  disabled={savingWater}
                  onClick={() => logWater(oz)}
                  className="border border-brand-ink/15 px-2.5 py-1.5 font-mono text-xs font-medium text-brand-ink/60 hover:bg-brand-green hover:text-white hover:border-brand-green disabled:opacity-50"
                >
                  +{oz}oz
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              placeholder="oz"
              value={waterAmount}
              onChange={(e) => setWaterAmount(e.target.value)}
              className="w-16 border-b border-brand-ink/25 bg-transparent py-1.5 text-sm text-brand-ink outline-none focus:border-brand-green"
            />
            <button
              type="button"
              disabled={savingWater || !waterAmount}
              onClick={() => logWater(Number(waterAmount))}
              className="bg-brand-green px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-green-dark disabled:opacity-50"
            >
              Log
            </button>
          </div>
        </div>

        {waterError && <p className="mt-3 text-sm text-brand-red">{waterError}</p>}

        <ul className="mt-4 divide-y divide-brand-ink/10">
          {todayWater.length === 0 && <li className="py-2 text-sm text-brand-ink/55">No water logged today.</li>}
          {todayWater.map((w) => (
            <li key={w.id} className="flex items-center justify-between py-2 text-sm text-brand-ink">
              <span>
                {w.ounces} oz{" "}
                <span className="font-mono text-brand-ink/45">
                  · {new Date(w.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
              </span>
              <button
                onClick={() => deleteWater(w)}
                className="text-xs font-semibold uppercase tracking-wide text-brand-ink/40 hover:text-brand-red"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </DashboardLayout>
  );
}
