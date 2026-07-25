import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { NAV_ITEMS, can } from "../config/permissions";
import { useAuth } from "../hooks/useAuth";
import { useSessionExpiryWarning } from "../hooks/useSessionExpiryWarning";
import {
  DashboardIcon,
  PatientsIcon,
  VisitsIcon,
  MedicineIcon,
  StaffIcon,
  ReportsIcon,
  AuditIcon,
  SearchIcon,
  CartIcon,
} from "../components/icons";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": DashboardIcon,
  "/patients": PatientsIcon,
  "/appointments": VisitsIcon,
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
  const canSearchPatients = can(role, "viewFullPatients");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="h-1.5 bg-slate-800" />
      <div className="flex">
        <aside className="w-56 min-h-[calc(100vh-6px)] bg-white shadow flex flex-col">
          <div className="px-5 py-5 border-b flex items-center gap-2">
            <span className="text-3xl font-bold text-slate-800 leading-none shrink-0">+</span>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                School Clinic
              </p>
              <h1 className="text-sm font-bold text-slate-800">Health System</h1>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            {visible.map((item) => {
              const Icon = NAV_ICONS[item.to] ?? DashboardIcon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sky-500 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t">
            <span className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">{role}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:underline"
            >
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white shadow-sm px-6 py-3 flex justify-end">
            {canSearchPatients && (
              <form onSubmit={handleSearch} className="relative w-72">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students..."
                  className="input pr-9"
                />
                <button
                  type="submit"
                  aria-label="Search students"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-sky-600"
                >
                  <SearchIcon />
                </button>
              </form>
            )}
          </header>

          <main className="flex-1 p-6 overflow-auto">
            {minutesLeft !== null && (
              <div className="mb-4 bg-amber-100 text-amber-800 text-sm px-4 py-2 rounded flex justify-between items-center">
                <span>
                  Your session will expire in {minutesLeft} minute{minutesLeft === 1 ? "" : "s"}. Please save your work.
                </span>
                <button
                  onClick={handleLogout}
                  className="text-amber-900 underline text-xs"
                >
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