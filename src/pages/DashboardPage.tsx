import { useEffect, useState } from "react";
import { api } from "../services/api";
import Layout from "../layout/Layout";
import { getCurrentRole } from "../utils/auth";

// DashboardPage shows a summary of clinic activity for the logged-in user.
function DashboardPage() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    lowStockCount: 0,
    todayVisits: 0,
    pendingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const role = getCurrentRole();
    const canAccessPatients = role === "admin" || role === "doctor" || role === "nurse";
    const canAccessMedicines = role === "admin" || role === "doctor" || role === "nurse";

    const fetchStats = async () => {
      try {
        const canAccessVisits = role === "admin" || role === "doctor" || role === "nurse";

        const [appointments, patients, medicines, todayVisits] = await Promise.all([
          api.get("/appointments?limit=1"),
          canAccessPatients ? api.get("/patients?limit=1") : Promise.resolve(null),
          canAccessMedicines ? api.get("/medicines/low-stock") : Promise.resolve(null),
          canAccessVisits ? api.get("/visits/today-count") : Promise.resolve(null),
        ]);

        setStats({
          totalPatients: patients?.pagination.total ?? 0,
          lowStockCount: medicines?.data.length ?? 0,
          todayVisits: todayVisits?.data.count ?? 0,
          pendingAppointments: appointments.pagination.total,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        <StatCard label="Total Patients" value={stats.totalPatients} color="blue" />
        <StatCard label="Low Stock Medicines" value={stats.lowStockCount} color="red" />
        <StatCard label="Total Appointments" value={stats.pendingAppointments} color="green" />
        <StatCard label="Today's Visits" value={stats.todayVisits} color="purple" />
      </div>
    </Layout>
  );
}

// StatCard displays a single number with a label.
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <div className={`rounded-lg p-6 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  );
}

export default DashboardPage;