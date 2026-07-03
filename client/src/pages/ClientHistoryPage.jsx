import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";

export default function ClientHistoryPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [student, setStudent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/admin/students/${id}/bookings`, { token })
      .then((data) => {
        setStudent(data.student);
        setBookings(data.bookings);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  return (
    <DashboardLayout
      eyebrow="Admin"
      title={student ? student.fullName : "Client history"}
      description={
        student
          ? `${student.email} · ${student.remainingCredits} credits remaining${
              student.startDate ? ` · started ${new Date(student.startDate).toLocaleDateString()}` : ""
            }`
          : ""
      }
    >
      <Link
        to="/admin"
        className="text-sm font-semibold text-brand-green underline decoration-brand-green/40 decoration-1 underline-offset-4 hover:text-brand-ink"
      >
        &larr; Back to operations
      </Link>

      {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}

      <section className="mt-6 border border-brand-ink/12 bg-white p-6">
        <h2 className="font-editorial text-xl text-brand-ink">Session history</h2>
        <ul className="mt-3 divide-y divide-brand-ink/10">
          {bookings.length === 0 && <li className="py-2 text-sm text-brand-ink/55">No sessions yet.</li>}
          {bookings.map((b) => (
            <li key={b.id} className="py-3 text-sm text-brand-ink">
              <div className="flex items-center justify-between">
                <span>
                  <span className="font-mono text-brand-ink/50">
                    {new Date(b.sessionTime).toLocaleString()}
                  </span>{" "}
                  with {b.coach.fullName}
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
