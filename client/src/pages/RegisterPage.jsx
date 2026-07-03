import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const DASHBOARD_BY_ROLE = { ADMIN: "/admin", COACH: "/coach", STUDENT: "/student" };

const DEMO_ACCOUNTS = [
  { role: "STUDENT", label: "Client", email: "student@example.com" },
  { role: "COACH", label: "Personal Trainer", email: "coach@example.com" },
  { role: "ADMIN", label: "Admin", email: "admin@example.com" },
];

export default function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "STUDENT" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(DASHBOARD_BY_ROLE[user.role] || "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function doDemoLogin(email) {
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, "password123");
      navigate(DASHBOARD_BY_ROLE[user.role] || "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-paper px-6 py-16">
      <div className="mx-auto w-full max-w-md">
        {/* Masthead */}
        <div className="border-t-[3px] border-brand-ink pt-3 text-center">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.35em] text-brand-green">
            Member Portal &middot; Est. 2026
          </p>
          <h1 className="mt-2 font-editorial text-4xl italic tracking-tight text-brand-ink">
            CRWC Fitness Services
          </h1>
        </div>

        {/* Form section — ruled, not boxed */}
        <div className="mt-10 border-t border-brand-ink/15 pt-9">
          <h2 className="font-editorial text-[28px] font-medium text-brand-ink">Create an account</h2>
          <p className="mt-1.5 text-sm text-brand-ink/55">Students and coaches both start here.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                Full name
              </label>
              <input
                required
                value={form.fullName}
                onChange={update("fullName")}
                className="w-full border-b border-brand-ink/25 bg-transparent py-2 text-[15px] text-brand-ink outline-none transition-colors focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={update("email")}
                className="w-full border-b border-brand-ink/25 bg-transparent py-2 text-[15px] text-brand-ink outline-none transition-colors focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={update("password")}
                className="w-full border-b border-brand-ink/25 bg-transparent py-2 text-[15px] text-brand-ink outline-none transition-colors focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-ink/45">
                I am a
              </label>
              <select
                value={form.role}
                onChange={update("role")}
                className="w-full border-b border-brand-ink/25 bg-transparent py-2 text-[15px] text-brand-ink outline-none transition-colors focus:border-brand-green"
              >
                <option value="STUDENT">Student</option>
                <option value="COACH">Coach</option>
              </select>
            </div>
            {error && <p className="text-sm text-brand-red">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-green py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-brand-green-dark disabled:opacity-50"
            >
              {submitting ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <div className="mt-9 border-t border-brand-ink/15 pt-5">
            <p className="text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-ink/35">
              Demo access
            </p>
            <div className="mt-3 flex items-center justify-center gap-5 text-xs">
              {DEMO_ACCOUNTS.map((account, i) => (
                <div key={account.role} className="flex items-center gap-5">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => doDemoLogin(account.email)}
                    className="font-semibold uppercase tracking-[0.08em] text-brand-green underline decoration-brand-green/40 decoration-1 underline-offset-4 hover:text-brand-ink disabled:opacity-50"
                  >
                    {account.label}
                  </button>
                  {i < DEMO_ACCOUNTS.length - 1 && <span className="text-brand-ink/20">·</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 border-t border-brand-ink/15 pt-6 text-center text-sm text-brand-ink/55">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-green hover:text-brand-ink">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
