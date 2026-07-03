import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";

export default function AdminCycleDetailPage() {
  const { label } = useParams();
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/admin/cycles/${label}/clients`, { token })
      .then((data) => setClients(data.clients))
      .catch((err) => setError(err.message));
  }, [label]);

  return (
    <DashboardLayout
      eyebrow="Admin"
      title={`Cycle ${label}`}
      description="Clients with sessions booked during this cycle."
    >
      <Link
        to="/admin/cycles"
        className="text-sm font-semibold text-brand-green underline decoration-brand-green/40 decoration-1 underline-offset-4 hover:text-brand-ink"
      >
        &larr; Back to cycles
      </Link>

      {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}

      <section className="mt-6 border border-brand-ink/12 bg-white p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-ink/12 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-brand-ink/45">
              <th className="pb-2 pl-3 font-medium">Name</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 pr-3 font-medium">Credits</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 pl-3 text-brand-ink/55">
                  No clients in this cycle.
                </td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-brand-ink/8 text-brand-ink last:border-b-0">
                <td className="py-3 pl-3">
                  <Link
                    to={`/admin/clients/${c.id}`}
                    title={`View ${c.fullName}'s session history`}
                    className="font-medium text-brand-green underline decoration-brand-green/40 decoration-1 underline-offset-4 hover:text-brand-ink"
                  >
                    {c.fullName}
                  </Link>
                </td>
                <td className="py-3 text-brand-ink/55">{c.email}</td>
                <td className="py-3 pr-3 font-mono font-semibold">{c.remainingCredits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </DashboardLayout>
  );
}
