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
  CartIcon,
} from "../components/icons";
import type { DashboardStats } from "../utils/types";

function activityLabel(action: string, resource: string): string {
  const verb = { create: "created", update: "updated", delete: "deleted", view: "viewed" }[action] ?? action;
  return `${verb} a ${resource}`;
}

function performedByName(p: DashboardStats["recentActivity"][number]["performedBy"]): string {
  if (!p) return "Someone";
  if (typeof p === "object") return p.name;
  return p;
}

function DashboardPage() {
  const { role, can } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get<DashboardStats>("/dashboard/stats");
        setStats(res.data);
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

  if (error || !stats) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error || "No dashboard data available"}</p>
        </div>
      </Layout>
    );
  }

  const hasAlerts = stats.lowStockCount > 0 || stats.outOfStockCount > 0 || stats.expiredCount > 0;

  return (
    <Layout>
      <h2 className="text-lg font-semibold text-gray-700 mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {can("viewFullPatients") && (
          <StatCard icon={PatientsIcon} label="Total Students" value={stats.totalStudents} color="blue" />
        )}
        <StatCard icon={ReportsIcon} label="Today's Appointments" value={stats.todaysAppointments} color="green" />
        {can("viewVisits") && (
          <StatCard icon={VisitsIcon} label="Waiting Patients" value={stats.waitingPatients} color="purple" />
        )}
        {can("viewMedicalHistory") && (
          <StatCard
            icon={ReportsIcon}
            label="Consultations This Month"
            value={stats.monthlyConsultations}
            color="blue"
          />
        )}
        {can("viewMedicines") && (
          <StatCard icon={MedicineIcon} label="Low Stock Items" value={stats.lowStockCount} color="red" />
        )}
        {can("viewMedicines") && (
          <StatCard icon={MedicineIcon} label="Out of Stock" value={stats.outOfStockCount} color="red" />
        )}
        {can("viewMedicines") && (
          <StatCard icon={MedicineIcon} label="Expired Items" value={stats.expiredCount} color="amber" />
        )}
        {can("viewPurchaseRequests") && (
          <StatCard
            icon={CartIcon}
            label="Pending Purchase Requests"
            value={stats.pendingPurchaseRequests}
            color="amber"
          />
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
            {can("submitPurchaseRequest") && (
              <Link to="/purchase-requests" className="quick-action-link">Submit Purchase Request</Link>
            )}
            {can("reviewPurchaseRequest") && stats.pendingPurchaseRequests > 0 && (
              <Link to="/purchase-requests" className="quick-action-link">
                Review {stats.pendingPurchaseRequests} Pending Request{stats.pendingPurchaseRequests === 1 ? "" : "s"}
              </Link>
            )}
            <Link to="/appointments" className="quick-action-link">View Appointments</Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Notifications &amp; Alerts</h3>
          {!hasAlerts && <p className="text-sm text-gray-400">No alerts right now.</p>}
          <ul className="flex flex-col gap-3">
            {stats.lowStockCount > 0 && (
              <li className="flex items-start gap-2 text-sm">
                <AlertIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium">{stats.lowStockCount}</span> item
                  {stats.lowStockCount === 1 ? "" : "s"} running low on stock
                </span>
              </li>
            )}
            {stats.outOfStockCount > 0 && (
              <li className="flex items-start gap-2 text-sm">
                <AlertIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium">{stats.outOfStockCount}</span> item
                  {stats.outOfStockCount === 1 ? "" : "s"} out of stock
                </span>
              </li>
            )}
            {stats.expiredCount > 0 && (
              <li className="flex items-start gap-2 text-sm">
                <AlertIcon className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <span>
                  <span className="font-medium">{stats.expiredCount}</span> item
                  {stats.expiredCount === 1 ? "" : "s"} expired
                </span>
              </li>
            )}
          </ul>
        </div>

        {role === "admin" && (
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Staff Overview</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-2 text-sm">
                <StaffIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Doctors</span>
                <span className="text-xs text-gray-400 ml-auto">{stats.usersByRole.doctor}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <StaffIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Nurses</span>
                <span className="text-xs text-gray-400 ml-auto">{stats.usersByRole.nurse}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <StaffIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Student Staff</span>
                <span className="text-xs text-gray-400 ml-auto">{stats.usersByRole.staff}</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <StaffIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Admins</span>
                <span className="text-xs text-gray-400 ml-auto">{stats.usersByRole.admin}</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {stats.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-5 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h3>
          <ul className="flex flex-col gap-2">
            {stats.recentActivity.map((log, i) => (
              <li key={i} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                <span>
                  <span className="font-medium">{performedByName(log.performedBy)}</span>{" "}
                  {activityLabel(log.action, log.resource)}
                </span>
                <span className="text-xs text-gray-400 shrink-0 ml-3">
                  {new Date(log.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
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