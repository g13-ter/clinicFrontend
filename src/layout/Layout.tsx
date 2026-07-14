import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { NAV_ITEMS, can } from "../config/permissions";
import { useAuth } from "../hooks/useAuth";
import { useSessionExpiryWarning } from "../hooks/useSessionExpiryWarning";
import {
  ClinicLogoIcon,
  DashboardIcon,
  PatientsIcon,
  VisitsIcon,
  MedicineIcon,
  StaffIcon,
  ReportsIcon,
  SettingsIcon,
  SearchIcon,
} from "../components/icons";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": DashboardIcon,
  "/patients": PatientsIcon,
  "/appointments": VisitsIcon,
  "/medicines": MedicineIcon,
  "/users": StaffIcon,
  "/reports": ReportsIcon,
  "/audit-log": SettingsIcon,
};

const NAV_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/patients": "Students",
  "/appointments": "Clinic Visits",
  "/medicines": "Medicine",
  "/users": "Staff",
  "/reports": "Reports",
  "/audit-log": "Settings",
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
    <div className="min-h-screen bg-[#e8e8e8]">
      <header className="flex items-center justify-between gap-6 px-6 py-4 bg-[#e8e8e8]">
        <div className="flex items-center gap-3 shrink-0">
          <ClinicLogoIcon />
          <h1 className="text-sm font-extrabold text-gray-900 leading-tight tracking-wide uppercase">
            Benedicto College<br />School Clinic
          </h1>
        </div>

        {canSearchPatients && (
          <form onSubmit={handleSearch} className="relative w-full max-w-xl ml-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="clinic-search pr-12"
            />
            <button
              type="submit"
              aria-label="Search students"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-sky-700"
            >
              <SearchIcon />
            </button>
          </form>
        )}
      </header>

      <div className="flex min-h-[calc(100vh-80px)]">
        <aside className="w-52 shrink-0 px-4 py-2 flex flex-col">
          <nav className="flex flex-col gap-1">
            {visible.map((item) => {
              const Icon = NAV_ICONS[item.to] ?? DashboardIcon;
              const label = NAV_LABELS[item.to] ?? item.label;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `clinic-nav-link ${isActive ? "clinic-nav-link-active" : "clinic-nav-link-inactive"}`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 pb-4">
            <span className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wider">{role}</span>
            <button onClick={handleLogout} className="text-xs text-red-500 hover:underline font-medium">
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-4 pb-6 overflow-auto">
          {minutesLeft !== null && (
            <div className="mb-4 bg-amber-100 text-amber-800 text-sm px-4 py-2 rounded-xl flex justify-between items-center">
              <span>
                Your session will expire in {minutesLeft} minute{minutesLeft === 1 ? "" : "s"}. Please save your work.
              </span>
              <button onClick={handleLogout} className="text-amber-900 underline text-xs">
                Log in again
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
