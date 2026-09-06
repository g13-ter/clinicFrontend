import { Link } from "react-router-dom";

export type DoctorWorkspaceTab =
  | "appointments"
  | "visits"
  | "records"
  | "consultation"
  | "followups"
  | "reports"
  | "notifications";

const tabs: { id: DoctorWorkspaceTab; label: string; to: string }[] = [
  { id: "appointments", label: "Appointments", to: "/dashboard" },
  { id: "visits", label: "Patient Visits", to: "/dashboard?tab=visits" },
  { id: "records", label: "Patient Records", to: "/dashboard?tab=records" },
  { id: "followups", label: "Follow-Ups", to: "/dashboard?tab=followups" },
  { id: "reports", label: "Reports", to: "/dashboard?tab=reports" },
];

function DoctorWorkspaceTabs({
  active,
  unreadCount = 0,
  onOpenNotifications,
}: {
  active: DoctorWorkspaceTab;
  unreadCount?: number;
  onOpenNotifications?: () => void;
}) {
  return (
    <nav aria-label="Doctor workspace" className="overflow-x-auto overscroll-x-contain">
      <div className="flex min-w-max snap-x rounded-xl border border-slate-200 bg-white px-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={active === tab.id ? "page" : undefined}
            className={`flex min-h-11 snap-start items-center border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              active === tab.id
                ? "border-blue-600 bg-blue-50/70 text-blue-700"
                : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {tab.label}
          </Link>
        ))}
        <Link
          to="/dashboard?tab=notifications"
          onClick={onOpenNotifications}
          aria-current={active === "notifications" ? "page" : undefined}
          className={`flex min-h-11 snap-start items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            active === "notifications"
              ? "border-blue-600 bg-blue-50/70 text-blue-700"
              : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          Notifications
          {unreadCount > 0 && (
            <span className="flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}

export default DoctorWorkspaceTabs;
