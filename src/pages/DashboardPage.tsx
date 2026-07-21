import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import Layout from "../layout/Layout";
import { useAuth } from "../hooks/useAuth";
import {
  PatientsIcon,
  MedicineIcon,
  VisitsIcon,
  ReportsIcon,
  StaffIcon,
  AlertIcon,
} from "../components/icons";
import type { Medicine, User } from "../utils/types";

function DashboardPage() {
  const { role, can } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    lowStockCount: 0,
    expiringCount: 0,
    todayVisits: 0,
    pendingAppointments: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<Medicine[]>([]);
  const [expiringItems, setExpiringItems] = useState<Medicine[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [appointments, patients, medicines, expiring, todayVisits, users] = await Promise.all([
          api.get("/appointments?limit=1"),
          can("viewFullPatients") ? api.get("/patients?limit=1") : Promise.resolve(null),
          can("viewMedicines") ? api.get("/medicines/low-stock") : Promise.resolve(null),
          can("viewMedicines") ? api.get("/medicines/expiring") : Promise.resolve(null),
          can("viewVisits") ? api.get("/visits/today-count") : Promise.resolve(null),
          role === "admin" ? api.get("/users?limit=5") : Promise.resolve(null),
        ]);

        setStats({
          totalPatients: patients?.pagination?.total ?? 0,
          lowStockCount: medicines?.data?.length ?? 0,
          expiringCount: expiring?.data?.length ?? 0,
          todayVisits: todayVisits?.data?.count ?? 0,
          pendingAppointments: appointments.pagination?.total ?? 0,
        });
        setLowStockItems(medicines?.data?.slice(0, 3) ?? []);
        setExpiringItems(expiring?.data?.slice(0, 3) ?? []);
        setStaff(users?.data ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [role]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }

  const hasAlerts = lowStockItems.length > 0 || expiringItems.length > 0;

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {can("viewFullPatients") && (
          <StatCard icon={PatientsIcon} label="Total Patients" value={stats.totalPatients} color="blue" />
        )}
        {can("viewMedicines") && (
          <StatCard icon={MedicineIcon} label="Low Stock Medicines" value={stats.lowStockCount} color="red" />
        )}
        {can("viewMedicines") && (
          <StatCard icon={MedicineIcon} label="Expiring Medicines" value={stats.expiringCount} color="amber" />
        )}
        <StatCard icon={ReportsIcon} label="Total Appointments" value={stats.pendingAppointments} color="green" />
        {can("viewVisits") && (
          <StatCard icon={VisitsIcon} label="Today's Visits" value={stats.todayVisits} color="purple" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            {can("editPatients") && (
              <Link to="/patients" className="quick-action-link">Add New Patient</Link>
            )}
            {role === "admin" && (
              <Link to="/users" className="quick-action-link">Add New Staff</Link>
            )}
            {can("editMedicines") && (
              <Link to="/medicines" className="quick-action-link">Update Medicine Inventory</Link>
            )}
            <Link to="/appointments" className="quick-action-link">View Appointments</Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Notifications &amp; Alerts</h3>
          {!hasAlerts && <p className="text-sm text-gray-400">No alerts right now.</p>}
          <ul className="flex flex-col gap-3">
            {lowStockItems.map((m) => (
              <li key={m._id} className="flex items-start gap-2 text-sm">
                <AlertIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium">Low Stock:</span> {m.name} - {m.quantity} {m.unit} remaining
                </span>
              </li>
            ))}
            {expiringItems.map((m) => (
              <li key={m._id} className="flex items-start gap-2 text-sm">
                <AlertIcon className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium">{m.isExpired ? "Expired:" : "Expiring Soon:"}</span> {m.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {role === "admin" && (
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Staff</h3>
            {staff.length === 0 && <p className="text-sm text-gray-400">No staff found.</p>}
            <ul className="flex flex-col gap-3">
              {staff.map((u) => (
                <li key={u._id} className="flex items-center gap-2 text-sm">
                  <StaffIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{u.name}</span>
                  <span className="text-xs text-gray-400 capitalize ml-auto">{u.role}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-center text-center gap-2">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>{label}</p>
    </div>
  );
}

export default DashboardPage;