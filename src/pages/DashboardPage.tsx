import { useEffect, useState } from "react";
import { api } from "../services/api";
import Layout from "../layout/Layout";
import { useAuth } from "../hooks/useAuth";

function DashboardPage() {
  const { role, can } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    lowStockCount: 0,
    expiringCount: 0,
    todayVisits: 0,
    pendingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [appointments, patients, medicines, expiring, todayVisits] = await Promise.all([
          api.get("/appointments?limit=1"),
          can("viewFullPatients") ? api.get("/patients?limit=1") : Promise.resolve(null),
          can("viewMedicines") ? api.get("/medicines/low-stock") : Promise.resolve(null),
          can("viewMedicines") ? api.get("/medicines/expiring") : Promise.resolve(null),
          can("viewVisits") ? api.get("/visits/today-count") : Promise.resolve(null),
        ]);

        setStats({
          totalPatients: patients?.pagination?.total ?? 0,
          lowStockCount: medicines?.data?.length ?? 0,
          expiringCount: expiring?.data?.length ?? 0,
          todayVisits: todayVisits?.data?.count ?? 0,
          pendingAppointments: appointments.pagination?.total ?? 0,
        });
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

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4 max-w-3xl">
        <StatCard label="Total Patients" value={stats.totalPatients} color="blue" />
        <StatCard label="Low Stock Medicines" value={stats.lowStockCount} color="red" />
        <StatCard label="Expiring Medicines" value={stats.expiringCount} color="amber" />
        <StatCard label="Total Appointments" value={stats.pendingAppointments} color="green" />
        <StatCard label="Today's Visits" value={stats.todayVisits} color="purple" />
      </div>
    </Layout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className={`rounded-lg p-6 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  );
}

export default DashboardPage;