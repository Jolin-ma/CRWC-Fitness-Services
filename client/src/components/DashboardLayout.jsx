import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarIcon,
  ClipboardIcon,
  FolderIcon,
  GridIcon,
  LogoutIcon,
  TrendIcon,
} from "./icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_BY_ROLE = {
  STUDENT: [
    { label: "Book sessions", Icon: CalendarIcon, to: "/student" },
    { label: "My progress", Icon: TrendIcon, to: "/student/progress" },
  ],
  COACH: [{ label: "My schedule", Icon: ClipboardIcon, to: "/coach" }],
  ADMIN: [
    { label: "Operations", Icon: GridIcon, to: "/admin" },
    { label: "Cycles", Icon: FolderIcon, to: "/admin/cycles" },
  ],
};

const ROLE_LABEL = {
  STUDENT: "Client",
  COACH: "Personal Trainer",
  ADMIN: "Admin",
};

function initials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function DashboardLayout({ eyebrow, title, description, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = NAV_BY_ROLE[user?.role] || [];

  return (
    <div className="flex min-h-screen bg-brand-paper">
      <aside className="flex w-72 shrink-0 flex-col bg-brand-ink">
        <div className="border-b border-white/10 px-6 py-6">
          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.3em] text-brand-green">
            Member Portal
          </p>
          <p className="mt-1 font-editorial text-xl italic tracking-tight text-white">
            CRWC Fitness Services
          </p>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-4">
          {(() => {
            const activeTo = nav
              .filter((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
              .sort((a, b) => b.to.length - a.to.length)[0]?.to;

            return nav.map((item) => {
              const active = item.to === activeTo;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 border-l-2 py-2.5 pl-3.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-brand-green bg-white/5 text-white"
                      : "border-transparent text-white/50 hover:text-white"
                  }`}
                >
                  <item.Icon className="h-[18px] w-[18px] text-brand-green" />
                  {item.label}
                </Link>
              );
            });
          })()}
        </nav>

        <div className="mx-4 mb-5 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-brand-green font-mono text-xs font-semibold text-white">
              {initials(user?.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                {ROLE_LABEL[user?.role] || user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 border border-white/10 py-2 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white"
          >
            <LogoutIcon />
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-brand-ink/12 px-10 pt-10 pb-6">
          {eyebrow && (
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-brand-green">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 font-editorial text-4xl italic tracking-tight text-brand-ink">
            {title}
          </h1>
          {description && <p className="mt-1.5 text-sm text-brand-ink/55">{description}</p>}
        </header>
        <main className="px-10 py-8">{children}</main>
      </div>
    </div>
  );
}
