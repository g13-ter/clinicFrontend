import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { NAV_ITEMS, can } from "../config/permissions";
import { useAuth } from "../hooks/useAuth";
import { useSessionExpiryWarning } from "../hooks/useSessionExpiryWarning";
import {
  DashboardIcon,
  PatientsIcon,
  VisitsIcon,
  CalendarIcon,
  MedicineIcon,
  StaffIcon,
  ReportsIcon,
  AuditIcon,
  SearchIcon,
  CartIcon,
} from "../components/icons";
import NotificationBell from "../components/NotificationBell";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": DashboardIcon,
  "/patients": PatientsIcon,
  "/patient-queue": VisitsIcon,
  "/appointments": CalendarIcon,
  "/medicines": MedicineIcon,
  "/purchase-requests": CartIcon,
  "/users": StaffIcon,
  "/reports": ReportsIcon,
  "/audit-log": AuditIcon,
};

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const minutesLeft = useSessionExpiryWarning();
  const [search, setSearch] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/patients?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const visible = NAV_ITEMS.filter((item) => role && item.roles.includes(role));
  const canSearchPatients = can(role, "searchPatients");

  return (
    <div className="min-h-screen bg-transparent print:bg-white">
      <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 print:hidden" />
      <div className="flex">
        <aside className="hidden w-72 min-h-[calc(100vh-6px)] flex-col border-r border-blue-100 bg-white/95 shadow-[16px_0_45px_-26px_rgba(37,99,235,0.35)] backdrop-blur print:hidden lg:flex">
          <div className="border-b border-blue-100 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 px-6 py-6 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl font-semibold shadow-lg">
                +
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-100">
                  School Clinic
                </p>
                <h1 className="text-sm font-bold">Health System</h1>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-5">
            <div className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Main Menu
            </div>
            <div className="space-y-1">
              {visible.map((item) => {
                const Icon = NAV_ICONS[item.to] ?? DashboardIcon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                          : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                      }`
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>
          <div className="border-t border-blue-100 px-5 py-5">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-3 text-sm text-orange-700">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-orange-500">Signed in as</p>
              <p className="mt-1 font-semibold">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 text-sm font-medium text-red-500 transition-colors hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex-col print:block">
          <header className="border-b border-blue-100 bg-white/90 px-6 py-4 shadow-sm backdrop-blur print:hidden">
            <div className="flex items-center justify-end gap-3">
              {canSearchPatients && (
                <form onSubmit={handleSearch} className="relative hidden w-72 md:block">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search students..."
                    className="input pr-10"
                  />
                  <button
                    type="submit"
                    aria-label="Search students"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-blue-600"
                  >
                    <SearchIcon />
                  </button>
                </form>
              )}
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6 print:p-0 print:overflow-visible">
            {minutesLeft !== null && (
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-700 print:hidden">
                <span>
                  Your session will expire in {minutesLeft} minute{minutesLeft === 1 ? "" : "s"}. Please save your work.
                </span>
                <button onClick={handleLogout} className="text-xs font-semibold underline">
                  Log in again
                </button>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Layout;