import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";
import StatTile from "../components/StatTile.jsx";
import { toISODate } from "../utils/date.js";

const CREDIT_PRESETS = [1, 3, 6, 10, 20];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    apiFetch("/admin/students", { token }).then(setStudents).catch((err) => setError(err.message));
    apiFetch("/admin/calendar", { token }).then(setBookings).catch((err) => setError(err.message));
  }

  async function adjustCredits(studentId, creditAdjustment) {
    setMessage("");
    setError("");
    try {
      await apiFetch("/admin/credits", {
        method: "PATCH",
        token,
        body: { studentId, creditAdjustment },
      });
      setMessage("Credits updated.");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStartDate(studentId, startDate) {
    setMessage("");
    setError("");
    try {
      await apiFetch(`/admin/students/${studentId}/start-date`, {
        method: "PATCH",
        token,
        body: { startDate },
      });
      setMessage("Start date updated.");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const upcomingCount = bookings.filter((b) => ["SCHEDULED", "RESCHEDULED"].includes(b.status)).length;
  const zeroBalanceCount = students.filter((s) => s.remainingCredits <= 0).length;

  return (
    <DashboardLayout
      eyebrow="Admin"
      title="Operations"
      description="Manage client balances."
    >
      <div className="grid grid-cols-3 gap-4">
        <StatTile label="Students" value={students.length} />
        <StatTile label="Upcoming sessions" value={upcomingCount} tone="accent" />
        <StatTile label="Zero balance" value={zeroBalanceCount} />
      </div>

      {message && <p className="mt-4 text-sm text-brand-green">{message}</p>}
      {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}

      <section className="mt-6 border border-brand-ink/12 bg-white p-6">
        <h2 className="font-editorial text-xl text-brand-ink">Client balances</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-ink/12 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-brand-ink/45">
              <th className="pb-2 pl-3 font-medium">Name</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Start date</th>
              <th className="pb-2 font-medium">Credits</th>
              <th className="pb-2 pr-3 font-medium">Add package</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-brand-ink/8 text-brand-ink last:border-b-0">
                <td className="py-3 pl-3">
                  <Link
                    to={`/admin/clients/${s.id}`}
                    title={`View ${s.fullName}'s session history`}
                    className="font-medium text-brand-green underline decoration-brand-green/40 decoration-1 underline-offset-4 hover:text-brand-ink"
                  >
                    {s.fullName}
                  </Link>
                </td>
                <td className="py-3 text-brand-ink/55">{s.email}</td>
                <td className="py-3">
                  <input
                    type="date"
                    defaultValue={s.startDate ? toISODate(s.startDate) : ""}
                    onChange={(e) => e.target.value && updateStartDate(s.id, e.target.value)}
                    className="border-b border-brand-ink/25 bg-transparent py-1 font-mono text-xs text-brand-ink outline-none focus:border-brand-green"
                  />
                </td>
                <td className="py-3 font-mono font-semibold">{s.remainingCredits}</td>
                <td className="py-3 pr-3">
                  <div className="flex flex-wrap gap-1.5">
                    {CREDIT_PRESETS.map((n) => (
                      <button
                        key={n}
                        onClick={() => adjustCredits(s.id, n)}
                        className="border border-brand-ink/15 px-2.5 py-1 font-mono text-xs font-medium text-brand-ink/60 hover:bg-brand-green hover:text-white hover:border-brand-green"
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  );
}
