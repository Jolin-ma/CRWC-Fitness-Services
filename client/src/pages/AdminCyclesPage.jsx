import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { FolderIcon } from "../components/icons.jsx";

export default function AdminCyclesPage() {
  const { token } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/admin/cycles", { token }).then(setCycles).catch((err) => setError(err.message));
  }, []);

  return (
    <DashboardLayout
      eyebrow="Admin"
      title="Cycles"
      description="Clients grouped by season (Sept 1 – Aug 31), based on their booked sessions."
    >
      {error && <p className="text-sm text-brand-red">{error}</p>}

      {cycles.length === 0 && !error && (
        <p className="text-sm text-brand-ink/55">No sessions booked yet, so no cycles to show.</p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {cycles.map((c) => (
          <Link
            key={c.label}
            to={`/admin/cycles/${c.label}`}
            className="flex items-center gap-3 border border-brand-ink/12 bg-white p-5 transition-colors hover:border-brand-green"
          >
            <FolderIcon className="h-6 w-6 shrink-0 text-brand-green" />
            <div>
              <p className="font-editorial text-lg text-brand-ink">{c.label}</p>
              <p className="text-xs text-brand-ink/50">
                {c.clientCount} {c.clientCount === 1 ? "client" : "clients"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
