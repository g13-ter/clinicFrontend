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
        <div className="flex h-64 items-center justify-center rounded-2xl border border-blue-100 bg-white/80 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 shadow-sm">
          <p className="text-sm font-medium">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-shell">
        <div className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 p-6 text-white shadow-[0_25px_50px_-22px_rgba(37,99,235,0.6)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-blue-100">School Clinic</p>
          <h2 className="mt-3 text-2xl font-semibold">Operations Overview</h2>
          <p className="mt-2 max-w-2xl text-sm text-blue-50/90">
            Stay on top of care delivery, medicine availability, and clinic activity from one dashboard.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total Patients" value={stats.totalPatients} color="blue" />
          <StatCard label="Low Stock Medicines" value={stats.lowStockCount} color="orange" />
          <StatCard label="Expiring Medicines" value={stats.expiringCount} color="amber" />
          <StatCard label="Total Appointments" value={stats.pendingAppointments} color="green" />
          <StatCard label="Today's Visits" value={stats.todayVisits} color="purple" />
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    orange: "border-orange-100 bg-orange-50 text-orange-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    purple: "border-violet-100 bg-violet-50 text-violet-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
  };

  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm font-medium">{label}</p>
    </div>
  );
}

export default DashboardPage;