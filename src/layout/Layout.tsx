import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentRole } from "../utils/auth";

const navItems = [
  { to: "/dashboard", label: "Dashboard", roles: ["admin", "doctor", "nurse", "staff"] },
  { to: "/patients", label: "Patients", roles: ["admin", "doctor", "nurse"] },
  { to: "/appointments", label: "Appointments", roles: ["admin", "doctor", "nurse", "staff"] },
  { to: "/medicines", label: "Medicines", roles: ["admin", "doctor", "nurse"] },
  { to: "/users", label: "Users", roles: ["admin"] },
  { to: "/reports", label: "Reports", roles: ["admin"] },
  { to: "/audit-log", label: "Audit Log", roles: ["admin"] },
];

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const role = getCurrentRole();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const visible = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-white shadow flex flex-col">
        <div className="px-6 py-5 border-b">
          <h1 className="text-base font-bold text-blue-700 leading-tight">
            School Clinic<br />System
          </h1>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
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

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}

export default Layout;
