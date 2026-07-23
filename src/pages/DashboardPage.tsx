import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import Layout from "../layout/Layout";
import { useAuth } from "../hooks/useAuth";
import {
  PlusIcon,
  StaffIcon,
  StethoscopeIcon,
  CalendarIcon,
  ReferralIcon,
  AlertIcon,
  ChevronRightIcon,
  StudentStatIcon,
  MedicineStatIcon,
  EmergencyStatIcon,
  ReferralStatIcon,
} from "../components/icons";
import type { Medicine, User } from "../utils/types";

const DEFAULT_COLORS = ["#5dade2", "#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6", "#f39c12"];

function DashboardPage() {
  const { role, can } = useAuth();
  const statsRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalMedicines: 0,
    clinicVisits: 0,
    emergencyCases: 0,
    referrals: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<Medicine[]>([]);
  const [expiringItems, setExpiringItems] = useState<Medicine[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [monthlyVisits, setMonthlyVisits] = useState<{ month: string; value: number; color?: string }[]>([]);
  const [commonIllnesses, setCommonIllnesses] = useState<{ label: string; value: number; color?: string }[]>([]);
  const [contagiousIllnesses, setContagiousIllnesses] = useState<{ label: string; value: number; color?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [appointments, patients, medicines, expiring, todayVisits, users] = await Promise.all([
          api.get("/appointments?limit=1"),
          can("viewFullPatients") ? api.get("/patients?limit=1") : Promise.resolve(null),
          can("viewMedicines") ? api.get("/medicines?limit=1") : Promise.resolve(null),
          can("viewMedicines") ? api.get("/medicines/expiring") : Promise.resolve(null),
          can("viewVisits") ? api.get("/visits/today-count") : Promise.resolve(null),
          role === "admin" ? api.get("/users?limit=5") : Promise.resolve(null),
        ]);

        const lowStock = can("viewMedicines")
          ? await api.get("/medicines/low-stock").catch(() => null)
          : null;

        // analytics: monthly visits and complaint counts
        let visitsMonthly: { month: string; value: number }[] | null = null;
        let complaints: { complaint: string; count: number }[] | null = null;

        if (can("viewVisits")) {
          visitsMonthly = await api.get("/analytics/visits-monthly?months=12").then((r) => r.data).catch(() => null);
          complaints = await api.get("/analytics/complaints").then((r) => r.data).catch(() => null);
        }

        setStats({
          totalPatients: patients?.pagination?.total ?? 0,
          totalMedicines: medicines?.pagination?.total ?? 0,
          clinicVisits: todayVisits?.data?.count ?? 0,
          emergencyCases: lowStock?.data?.length ?? 0,
          referrals: appointments.pagination?.total ?? 0,
        });
        setLowStockItems(lowStock?.data?.slice(0, 2) ?? []);
        setExpiringItems(expiring?.data?.slice(0, 1) ?? []);
        setStaff(users?.data ?? []);

        // map analytics into chart-friendly shapes with colors
        if (visitsMonthly) {
          setMonthlyVisits(
            visitsMonthly.map((v, i) => ({ ...v, color: DEFAULT_COLORS[i % DEFAULT_COLORS.length] }))
          );
        }

        if (complaints) {
          const mapped = complaints.map((c) => ({ label: c.complaint, value: c.count }));

          // Common illnesses: top 4 complaints
          setCommonIllnesses(
            mapped.slice(0, 4).map((m, i) => ({ ...m, color: DEFAULT_COLORS[i % DEFAULT_COLORS.length] }))
          );

          // Contagious illnesses: filter by a small keyword set
          const contagiousKeywords = ["flu", "chicken", "pox", "sore", "cough", "cold"];
          const contagious = mapped.filter((m) =>
            contagiousKeywords.some((k) => m.label.toLowerCase().includes(k))
          );
          setContagiousIllnesses(
            contagious.slice(0, 4).map((m, i) => ({ ...m, color: DEFAULT_COLORS[i % DEFAULT_COLORS.length] }))
          );
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [role]);

  const scrollStats = () => {
    statsRef.current?.scrollBy({ left: 170, behavior: "smooth" });
  };

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

  const statCards = [
    can("viewFullPatients") && {
      icon: <StudentStatIcon />,
      value: stats.totalPatients,
      label: "Total Students",
    },
    can("viewMedicines") && {
      icon: <MedicineStatIcon />,
      value: stats.totalMedicines,
      label: "Number of Medications",
    },
    can("viewVisits") && {
      icon: <StethoscopeIcon />,
      value: stats.clinicVisits,
      label: "Clinic Visits",
    },
    {
      icon: <EmergencyStatIcon />,
      value: stats.emergencyCases,
      label: "Emergency Cases",
    },
    {
      icon: <ReferralStatIcon />,
      value: stats.referrals,
      label: "Referal",
    },
  ].filter(Boolean) as { icon: React.ReactNode; value: number; label: string }[];

  const hasAlerts = lowStockItems.length > 0 || expiringItems.length > 0;

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-5">
        <div ref={statsRef} className="flex gap-3 overflow-x-auto scrollbar-hide flex-1 pb-1">
          {statCards.map((card) => (
            <div key={card.label} className="clinic-stat-card">
              <div className="mb-2">{card.icon}</div>
              <p className="clinic-stat-value">{card.value}</p>
              <p className="clinic-stat-label">{card.label}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={scrollStats} className="clinic-scroll-btn" aria-label="Scroll stats">
          <ChevronRightIcon />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-4">
        <div className="clinic-panel xl:col-span-1">
          <h3 className="clinic-panel-title">Quick Action</h3>
          <div className="flex flex-col gap-2.5">
            {can("editPatients") && (
              <Link to="/patients" className="clinic-quick-action">
                <PlusIcon className="text-sky-600" />
                Add New Student
              </Link>
            )}
            {role === "admin" && (
              <Link to="/users" className="clinic-quick-action">
                <StaffIcon className="w-4 h-4 text-sky-600" />
                Add New Staff
              </Link>
            )}
            <Link to="/appointments" className="clinic-quick-action">
              <StethoscopeIcon className="w-5 h-5" />
              Clinic Visits
            </Link>
            {can("editMedicines") && (
              <Link to="/medicines" className="clinic-quick-action">
                <CalendarIcon className="text-sky-600" />
                Update Medication Inventory
              </Link>
            )}
            <Link to="/appointments" className="clinic-quick-action">
              <ReferralIcon className="text-sky-600" />
              Create Referal
            </Link>
          </div>
        </div>

        <div className="clinic-panel xl:col-span-1">
          <h3 className="clinic-panel-title">Notifications &amp; Alerts</h3>
          {!hasAlerts && (
            <p className="text-sm text-gray-600 bg-white/50 rounded-lg px-3 py-2">
              No alerts right now.
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {lowStockItems.map((m) => (
              <li key={m._id} className="flex items-start gap-2 text-sm text-gray-800">
                <AlertIcon className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <span>
                  <span className="font-bold">Low Stock Alert!</span> {m.name} - {m.quantity} Remaining
                </span>
              </li>
            ))}
            {expiringItems.map((m) => (
              <li key={m._id} className="flex items-start gap-2 text-sm text-gray-800">
                <CalendarIcon className="w-5 h-5 text-sky-600 mt-0.5 shrink-0" />
                <span>
                  <span className="font-bold">Upcoming Check-up</span> Medical for {m.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="clinic-panel xl:col-span-1">
          <h3 className="clinic-panel-title">Search &amp; Filters</h3>
          {staff.length === 0 ? (
            <p className="text-sm text-gray-600">No staff found.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {staff.map((u) => (
                <li key={u._id} className="flex items-center gap-3 text-sm font-medium text-gray-800">
                  <span className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {u.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <span>{u.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="clinic-panel xl:col-span-1">
          <h3 className="clinic-panel-title">Monthly Clinic Visits Trend</h3>
          <BarChart data={monthlyVisits} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="clinic-panel">
          <h3 className="clinic-panel-title uppercase tracking-wide">Common Illnesses Record</h3>
          <PieChart segments={commonIllnesses} showPercent />
        </div>
        <div className="clinic-panel">
          <h3 className="clinic-panel-title uppercase tracking-wide">Contagious Illnesses Record</h3>
          <PieChart segments={contagiousIllnesses} />
        </div>
      </div>
    </Layout>
  );
}

function BarChart({ data }: { data: { month: string; value: number; color: string }[] }) {
  const max = Math.max(0, ...data.map((d) => d.value));

  return (
    <div className="flex items-end justify-start gap-2 h-36 pt-2 overflow-x-auto px-1">
      {data.map((item) => (
        <div key={item.month} className="flex flex-col items-center gap-1 min-w-[42px]">
          <div
            className="w-full max-w-[42px] rounded-t-md transition-all"
            style={{
              height: `${max > 0 ? (item.value / max) * 100 : 20}%`,
              minHeight: "20%",
              backgroundColor: item.color,
            }}
          />
          <span className="text-[10px] font-semibold text-gray-700 text-center w-full break-words">{item.month}</span>
        </div>
      ))}
    </div>
  );
}

function PieChart({
  segments,
  showPercent = false,
}: {
  segments: { label: string; value: number; color: string }[];
  showPercent?: boolean;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let cumulative = 0;

  const slices = segments.map((segment) => {
    const start = (cumulative / total) * 360;
    cumulative += segment.value;
    const end = (cumulative / total) * 360;
    return { ...segment, start, end };
  });

  const polarToCartesian = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number, radius: number) => {
    const startPoint = polarToCartesian(start, radius);
    const endPoint = polarToCartesian(end, radius);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M 50 50 L ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y} Z`;
  };

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {slices.map((slice) => (
            <path key={slice.label} d={describeArc(slice.start, slice.end, 45)} fill={slice.color} />
          ))}
          <circle cx="50" cy="50" r="18" fill="#d8ecf7" />
        </svg>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 font-medium text-gray-800">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: segment.color }} />
            {segment.label}
            {showPercent && (
              <span className="text-gray-600">({Math.round((segment.value / total) * 100)}%)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DashboardPage;
