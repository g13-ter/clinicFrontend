import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

// DashboardPage shows a summary of clinic activity for the logged-in user.
function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalPatients: 0,
    lowStockCount: 0,
    todayVisits: 0,
    pendingAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patients, medicines, appointments] = await Promise.all([
          api.get("/patients?limit=1"),
          api.get("/medicines/low-stock"),
          api.get("/appointments?limit=1"),
        ]);

        setStats({
          totalPatients: patients.pagination.total,
          lowStockCount: medicines.data.length,
          todayVisits: 0,
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700">School Clinic System</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:underline"
        >
          Logout
        </button>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Dashboard</h2>

        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total Patients" value={stats.totalPatients} color="blue" />
          <StatCard label="Low Stock Medicines" value={stats.lowStockCount} color="red" />
          <StatCard label="Total Appointments" value={stats.pendingAppointments} color="green" />
          <StatCard label="Today's Visits" value={stats.todayVisits} color="purple" />
        </div>
      </main>
    </div>
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