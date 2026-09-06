import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import Layout from "../layout/Layout";
import { useAuth } from "../hooks/useAuth";
import {
  CalendarIcon,
  PatientsIcon,
  StaffIcon,
  VisitsIcon,
} from "../components/icons";
import type { Appointment, ClinicVisit, DashboardStats, InAppNotification, Patient } from "../utils/types";
import {
  buildDashboardAlerts,
  dashboardAlertKey,
  type DashboardAlert,
} from "../utils/dashboardAlerts";
import DoctorWorkspaceTabs from "../components/DoctorWorkspaceTabs";
import AdminSectionTabs, { type AdminSection } from "../components/AdminSectionTabs";
import { useToast } from "../hooks/useToast";
import { useDashboardData } from "../features/dashboard/useDashboardData";
import PatientQueuePage from "./PatientQueuePage";
import AppointmentsPage from "./AppointmentsPage";
import ClinicalWorkspacePage from "./ClinicalWorkspacePage";
import MedicinesPage from "./MedicinesPage";
import PurchaseRequestsPage from "./PurchaseRequestsPage";
import UsersPage from "./UsersPage";
import PatientsPage from "./PatientsPage";
import type { DoctorWorkspaceTab } from "../components/DoctorWorkspaceTabs";
import SuperAdminDashboardPage from "./SuperAdminDashboardPage";
import MedicationOrdersPage from "./MedicationOrdersPage";
import { useInAppNotifications } from "../features/notifications/useInAppNotifications";
import { patientIdentifier, patientTypeLabel } from "../utils/patient";
import ClinicAnalytics from "../features/dashboard/ClinicAnalytics";
import ReportsPage from "./ReportsPage";
import PatientRecordModal from "../components/PatientRecordModal";
import InventoryLabelsPage from "./InventoryLabelsPage";
import SettingsPage from "./SettingsPage";

function DashboardPage() {
  const { role, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { stats, todayAppointments, error } = useDashboardData(role, user?.id);
  const doctorNotifications = useInAppNotifications(role === "doctor");
  const alertStorageKey = `clinic-seen-alerts:${role ?? "unknown"}`;
  const [seenAlertKeys, setSeenAlertKeys] = useState<string[]>(() =>
    readSeenAlertKeys(alertStorageKey),
  );
  const [viewingPatientId, setViewingPatientId] = useState<string | null>(null);

  const alerts = stats ? buildDashboardAlerts(role, stats) : [];
  const derivedUnreadCount = alerts.filter(
    (alert) => !seenAlertKeys.includes(dashboardAlertKey(alert)),
  ).length;
  const unreadCount = role === "doctor" ? doctorNotifications.unreadCount : derivedUnreadCount;
  const requestedView = searchParams.get("view");
  const workspaceView =
    requestedView === "students" ||
    requestedView === "records" ||
    requestedView === "appointments" ||
    requestedView === "inventory" ||
    requestedView === "inventory-labels" ||
    requestedView === "medications" ||
    requestedView === "purchase-requests" ||
    requestedView === "reports" ||
    requestedView === "settings" ||
    requestedView === "notifications"
      ? requestedView
      : "visits";
  const requestedDoctorTab = searchParams.get("tab");
  const doctorTab: DoctorWorkspaceTab =
    requestedDoctorTab === "visits" ||
    requestedDoctorTab === "records" ||
    requestedDoctorTab === "consultation" ||
    requestedDoctorTab === "followups" ||
    requestedDoctorTab === "reports" ||
    requestedDoctorTab === "notifications"
      ? requestedDoctorTab
      : "appointments";
  const adminSection: AdminSection = searchParams.get("section") === "purchase-requests"
    ? "purchase-requests"
    : "management";

  const openNotifications = () => {
    const currentKeys = alerts.map(dashboardAlertKey);
    localStorage.setItem(alertStorageKey, JSON.stringify(currentKeys));
    setSeenAlertKeys(currentKeys);
    setSearchParams({ view: "notifications" }, { replace: true });
  };

  const openSettings = () => {
    setSearchParams({ view: "settings" }, { replace: true });
  };

  if (role === "superadmin") return <SuperAdminDashboardPage />;

  if (error) {
    return (
      <Layout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  const dashboardTitle = `${role ? titleCase(role) : "Clinic"} Dashboard`;
  const activeUsers = stats.usersByRole.doctor + stats.usersByRole.nurse + stats.usersByRole.staff;
  const isClinicalRole = role === "doctor" || role === "nurse";
  const isAdmin = role === "admin";
  const isDoctor = role === "doctor";
  const isStaff = role === "staff";

  return (
    <Layout>
      <div className="mx-auto w-full max-w-[1600px] space-y-5">
        <div className="space-y-4 pb-1 lg:pb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {dashboardTitle}
            </h2>
          </div>

          {isClinicalRole && <ClinicAnalytics />}

          {isAdmin && (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard label="Total Patients" value={stats.totalPatients} caption={`${stats.patientsByType.student} students · ${stats.patientsByType.teacher} teachers · ${stats.patientsByType.staff} staff`} icon={<PatientsIcon />} tone="blue" />
              <StatCard label="Active Users" value={activeUsers} caption="Available doctors, nurses, and staff" icon={<StaffIcon />} tone="purple" />
            </section>
          )}

          {!isAdmin && <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isClinicalRole ? (
              <>
                <StatCard label="Today's Appointments" value={stats.todaysAppointments} caption="Scheduled today" icon={<CalendarIcon />} tone="blue" />
                <StatCard label="Patients Waiting" value={stats.waitingPatients} caption="All patient types in the clinic queue" icon={<PatientsIcon />} tone="orange" />
                <StatCard label="Consultations Today" value={stats.consultationsToday} caption="Started or completed" icon={<VisitsIcon />} tone="green" />
                <StatCard label="Emergency Cases" value={stats.emergencyCasesToday} caption="Recorded today" icon={<VisitsIcon />} tone="red" />
              </>
            ) : isStaff ? (
              <>
                <StatCard label="Total Patients" value={stats.totalPatients} caption={`${stats.patientsByType.student} students · ${stats.patientsByType.teacher} teachers · ${stats.patientsByType.staff} staff`} icon={<PatientsIcon />} tone="blue" />
                <StatCard label="Visits Today" value={stats.todayVisits} caption="Recorded today" icon={<VisitsIcon />} tone="green" />
                <StatCard label="Patients Waiting" value={stats.waitingPatients} caption="All patient types in the clinic queue" icon={<StaffIcon />} tone="purple" />
                <StatCard label="Pending Appointments" value={stats.pendingAppointments} caption="Awaiting confirmation" icon={<CalendarIcon />} tone="orange" />
              </>
            ) : (
              <>
                <StatCard label="Total Patients" value={stats.totalPatients} caption={`${stats.patientsByType.student} students · ${stats.patientsByType.teacher} teachers · ${stats.patientsByType.staff} staff`} icon={<PatientsIcon />} tone="blue" />
                <StatCard label="Clinic Visits Today" value={stats.todayVisits} caption="Recorded today" icon={<VisitsIcon />} tone="green" />
                <StatCard label="Active Users" value={activeUsers} caption="Available doctors, nurses, and staff" icon={<StaffIcon />} tone="purple" />
                <StatCard label="Pending Appointments" value={stats.pendingAppointments} caption="Awaiting confirmation" icon={<CalendarIcon />} tone="orange" />
              </>
            )}
          </section>}

          {isAdmin && <AdminSectionTabs active={adminSection} />}

          {isDoctor && (
            <DoctorWorkspaceTabs
              active={doctorTab}
              unreadCount={unreadCount}
            />
          )}

          {!isAdmin && !isDoctor && (
            <RoleWorkspaceTabs
              role={role}
              unreadCount={unreadCount}
              activeView={workspaceView}
              onOpenSettings={openSettings}
              onOpenNotifications={openNotifications}
            />
          )}
        </div>

        <div className="min-h-[32rem] [overflow-anchor:none]">
        {!isAdmin && !isDoctor ? (
          workspaceView === "notifications" ? (
            <NotificationsPanel alerts={alerts} />
          ) : workspaceView === "settings" ? (
            <SettingsPage embedded />
          ) : workspaceView === "students" ? (
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <PatientsPage embedded />
            </section>
          ) : workspaceView === "records" ? (
            <ClinicalWorkspacePage embedded />
          ) : workspaceView === "inventory" ? (
            <MedicinesPage embedded />
          ) : workspaceView === "inventory-labels" ? (
            <InventoryLabelsPage embedded />
          ) : workspaceView === "medications" ? (
            <MedicationOrdersPage embedded />
          ) : workspaceView === "purchase-requests" ? (
            <PurchaseRequestsPage embedded />
          ) : workspaceView === "reports" ? (
            <ReportsPage embedded />
          ) : workspaceView === "appointments" ? (
            <AppointmentsPage embedded />
          ) : (
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <PatientQueuePage embedded />
            </section>
          )
        ) : isDoctor ? (
          doctorTab === "notifications" ? (
            <InAppNotificationsPanel
              notifications={doctorNotifications.items}
              unreadCount={doctorNotifications.unreadCount}
              error={doctorNotifications.error}
              loading={doctorNotifications.loading}
              onRead={doctorNotifications.markRead}
              onMarkAllRead={doctorNotifications.markAllRead}
              onRetry={doctorNotifications.refresh}
            />
          ) : doctorTab === "appointments" ? (
            <>
              <TodayAppointments appointments={todayAppointments} />
              <RecentCases
                cases={stats.recentCases}
                title="Recent Consultations"
                onViewPatient={setViewingPatientId}
              />
            </>
          ) : doctorTab === "visits" ? (
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <PatientQueuePage embedded />
            </section>
          ) : doctorTab === "reports" ? (
            <ReportsPage embedded />
          ) : (
            <ClinicalWorkspacePage embedded />
          )
        ) : isAdmin ? (
          adminSection === "purchase-requests" ? (
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <PurchaseRequestsPage embedded />
            </section>
          ) : (
            <UsersPage embedded />
          )
        ) : null}
        </div>
        <PatientRecordModal
          patientId={viewingPatientId}
          onClose={() => setViewingPatientId(null)}
        />
      </div>
    </Layout>
  );
}

function readSeenAlertKeys(storageKey: string): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(stored) && stored.every((item) => typeof item === "string")
      ? stored
      : [];
  } catch {
    return [];
  }
}

function RoleWorkspaceTabs({
  role,
  unreadCount,
  activeView,
  onOpenSettings,
  onOpenNotifications,
}: {
  role: string | null;
  unreadCount: number;
  activeView: "students" | "records" | "visits" | "appointments" | "inventory" | "inventory-labels" | "medications" | "purchase-requests" | "reports" | "settings" | "notifications";
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}) {
  const tabs = [
    { label: "Patients", to: "/dashboard?view=students", view: "students", roles: ["nurse", "staff"] },
    { label: "Patient Visits", to: "/dashboard?view=visits", view: "visits", roles: ["nurse", "staff"] },
    { label: "Appointments", to: "/dashboard?view=appointments", view: "appointments", roles: ["nurse", "staff"] },
    { label: "Inventory", to: "/dashboard?view=inventory", view: "inventory", roles: ["nurse"] },
    { label: "Purchase Requests", to: "/dashboard?view=purchase-requests", view: "purchase-requests", roles: ["nurse"] },
    { label: "Medication Requests", to: "/dashboard?view=medications", view: "medications", roles: ["nurse"] },
  ].filter((tab) => role && tab.roles.includes(role));

  return (
    <nav aria-label="Workspace shortcuts" className="overflow-x-auto">
      <div className="flex min-w-max rounded-xl border border-slate-200 bg-white px-2">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={"view" in tab && activeView === tab.view ? "page" : undefined}
            className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              "view" in tab && activeView === tab.view
                ? "border-blue-600 bg-blue-50/70 text-blue-700"
                : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            {tab.label}
          </Link>
        ))}
        {role === "nurse" && (
          <Link
            to="/dashboard?view=reports"
            aria-current={activeView === "reports" ? "page" : undefined}
            className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeView === "reports"
                ? "border-blue-600 bg-blue-50/70 text-blue-700"
                : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            Reports
          </Link>
        )}
        <button
          type="button"
          onClick={onOpenNotifications}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeView === "notifications"
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
        </button>
        {role === "nurse" && (
          <button
            type="button"
            onClick={onOpenSettings}
            aria-current={activeView === "settings" ? "page" : undefined}
            className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeView === "settings"
                ? "border-blue-600 bg-blue-50/70 text-blue-700"
                : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            Settings
          </button>
        )}
      </div>
    </nav>
  );
}

function NotificationsPanel({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <p className="mt-1 text-xs text-gray-500">
          Current clinic items that need your attention
        </p>
      </div>
      {alerts.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">
          You&apos;re all caught up.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {alerts.map((alert) => (
            <Link
              key={dashboardAlertKey(alert)}
              to={alert.link}
              className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50"
            >
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  alert.tone === "warning" ? "bg-red-500" : "bg-blue-500"
                }`}
              />
              <span className="text-sm text-gray-700">{alert.message}</span>
              <span className="ml-auto text-xs font-medium text-blue-600">View</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function InAppNotificationsPanel({
  notifications,
  unreadCount,
  error,
  loading,
  onRead,
  onMarkAllRead,
  onRetry,
}: {
  notifications: InAppNotification[];
  unreadCount: number;
  error: string;
  loading: boolean;
  onRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onRetry: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const visibleNotifications = filter === "unread"
    ? notifications.filter((notification) => !notification.readAt)
    : notifications;

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          <p className="mt-1 text-xs text-gray-500">Appointments and clinic cases assigned to you</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 p-1" aria-label="Filter notifications">
            {(["all", "unread"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
                className={`min-h-9 rounded-md px-3 text-xs font-medium capitalize ${filter === option ? "bg-slate-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {option}{option === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={() => void onMarkAllRead()} className="min-h-11 text-xs font-medium text-blue-600 hover:underline">
              Mark all read
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div role="status" aria-label="Loading notifications" className="space-y-3 px-5 py-5">
          {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-gray-100" />)}
        </div>
      ) : error ? (
        <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm text-red-600">
          <span>{error}</span>
          <button type="button" onClick={() => void onRetry()} className="min-h-11 font-medium underline">Retry</button>
        </div>
      ) : visibleNotifications.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">
          {filter === "unread" ? "No unread notifications." : "You’re all caught up."}
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {visibleNotifications.map((notification) => (
            <Link
              key={notification._id}
              to={dashboardNotificationLink(notification.link)}
              onClick={() => void onRead(notification._id)}
              className={`flex items-start gap-3 px-5 py-4 hover:bg-gray-50 ${notification.readAt ? "opacity-70" : "bg-blue-50/30"}`}
            >
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.kind === "emergency" || notification.kind === "appointment_cancelled" ? "bg-red-500" : "bg-blue-500"}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900">{notification.title}</span>
                <span className="mt-0.5 block text-sm text-gray-600">{notification.message}</span>
                <span className="mt-1 block text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString()}</span>
              </span>
              <span className="text-xs font-medium text-blue-600">View</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function dashboardNotificationLink(link: string): string {
  if (link.startsWith("/clinical-workspace?")) {
    return `/dashboard?${link.slice(link.indexOf("?") + 1)}`;
  }
  if (link === "/patient-queue") return "/dashboard?tab=visits";
  if (link === "/appointments") return "/dashboard?tab=appointments";
  return link;
}

function StatCard({
  label,
  value,
  icon,
  tone,
  caption,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "blue" | "green" | "purple" | "orange" | "red";
  caption: string;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-violet-50 text-violet-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <article className="flex min-h-28 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <span className={`rounded-lg p-2 ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="mt-auto">
        <p className="text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{caption}</p>
      </div>
    </article>
  );
}

function TodayAppointments({ appointments }: { appointments: Appointment[] }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [startingId, setStartingId] = useState("");
  const [confirmingId, setConfirmingId] = useState("");
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);
  const activeAppointments = appointments.filter(
    (appointment) => appointment.status !== "cancelled" && appointment.status !== "completed",
  );

  const startConsultation = async (appointment: Appointment, student: Patient | null) => {
    if (!student) {
      showToast("Student record is unavailable.", "error");
      return;
    }

    setStartingId(appointment._id);
    try {
      const linkedVisit =
        appointment.visitId && typeof appointment.visitId === "object"
          ? appointment.visitId
          : null;
      const visitId =
        typeof appointment.visitId === "string"
          ? appointment.visitId
          : linkedVisit?._id ?? "";
      if (!visitId) {
        showToast("Waiting for nurse check-in and triage before consultation", "warning");
        return;
      }

      const currentVisit = linkedVisit ??
        (await api.get<ClinicVisit>(`/visits/${visitId}`)).data;
      if (!currentVisit.readyForDoctor) {
        showToast("A nurse must record triage and mark the student ready first", "warning");
        return;
      }
      await api.put(`/visits/${visitId}/status`, { status: "in_consultation" });
      const params = new URLSearchParams({
        tab: "consultation",
        appointmentId: appointment._id,
        visitId,
        patientId: student._id,
      });
      navigate(`/dashboard?${params}`);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Failed to start consultation", "error");
    } finally {
      setStartingId("");
    }
  };

  const confirmAppointment = async (appointment: Appointment) => {
    setConfirmingId(appointment._id);
    try {
      const response = await api.put(`/appointments/${appointment._id}/confirm`, {});
      setConfirmedIds((current) =>
        current.includes(appointment._id)
          ? current
          : [...current, appointment._id],
      );
      showToast(response.message);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Failed to confirm appointment", "error");
    } finally {
      setConfirmingId("");
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-900">Today&apos;s Appointments</h3>
        <p className="mt-1 text-xs text-gray-500">
          Confirm pending appointments, then start the consultation when the student is ready.
        </p>
      </div>
      {activeAppointments.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">No appointments scheduled for today.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Patient ID</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeAppointments.map((appointment) => {
                const effectiveStatus = confirmedIds.includes(appointment._id)
                  ? "confirmed"
                  : appointment.status;
                const student =
                  appointment.patientId && typeof appointment.patientId === "object"
                    ? appointment.patientId as Patient
                    : null;
                const linkedVisit =
                  appointment.visitId && typeof appointment.visitId === "object"
                    ? appointment.visitId
                    : null;
                const awaitingNurse =
                  effectiveStatus !== "pending" &&
                  (!appointment.visitId || (linkedVisit && !linkedVisit.readyForDoctor));
                return (
                  <tr key={appointment._id}>
                    <td className="whitespace-nowrap px-5 py-4 font-medium">
                      {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-4">{student ? `${student.firstName} ${student.lastName}` : "Unknown patient"}</td>
                    <td className="px-5 py-4 font-mono text-xs">{student ? `${patientIdentifier(student)} · ${patientTypeLabel(student)}` : "—"}</td>
                    <td className="px-5 py-4">{appointment.reason}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        effectiveStatus === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : effectiveStatus === "checked_in"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-amber-100 text-amber-700"
                      }`}>
                        {effectiveStatus.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {effectiveStatus === "pending" ? (
                        <button
                          type="button"
                          onClick={() => confirmAppointment(appointment)}
                          disabled={confirmingId === appointment._id}
                          className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
                        >
                          {confirmingId === appointment._id
                            ? "Confirming..."
                            : "Confirm Appointment"}
                        </button>
                      ) : awaitingNurse ? (
                        <span className="text-xs font-medium text-amber-700">
                          {!appointment.visitId
                            ? "Awaiting nurse check-in"
                            : "Awaiting nurse triage"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startConsultation(appointment, student)}
                          disabled={startingId === appointment._id}
                          className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50 disabled:cursor-wait disabled:opacity-50"
                        >
                          {startingId === appointment._id ? "Starting..." : "Start Consultation"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RecentCases({
  cases,
  title = "Recent Medical Cases",
  onViewPatient,
}: {
  cases: DashboardStats["recentCases"];
  title?: string;
  onViewPatient: (patientId: string) => void;
}) {
  const doctorView = title === "Recent Consultations";

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>

      {cases.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-500">No clinic cases recorded yet.</p>
      ) : (
        <>
          <div className="divide-y md:hidden">
            {cases.map((caseItem) => (
              <article key={caseItem.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {caseItem.student ? (
                      <button type="button" onClick={() => onViewPatient(caseItem.student!.id)} className="text-left font-medium text-blue-600 hover:underline">
                        {caseItem.student.name}
                      </button>
                    ) : (
                      <span className="font-medium text-gray-700">Archived student</span>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(caseItem.date).toLocaleDateString()}
                    </p>
                  </div>
                  <ProviderBadge provider={caseItem.provider} />
                </div>
                <div className="grid gap-2 text-sm">
                  <p><span className="text-gray-400">Complaint:</span> {caseItem.complaint}</p>
                  <p><span className="text-gray-400">{doctorView ? "Diagnosis" : "Assessment"}:</span> {caseItem.assessment}</p>
                  <p><span className="text-gray-400">Treatment:</span> {caseItem.treatment}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Complaint</th>
                  <th className="px-5 py-3 font-medium">{doctorView ? "Diagnosis" : "Assessment / Findings"}</th>
                  <th className="px-5 py-3 font-medium">Treatment</th>
                  <th className="px-5 py-3 font-medium">Attending Clinician</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                      {new Date(caseItem.date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      {caseItem.student ? (
                        <>
                          <button type="button" onClick={() => onViewPatient(caseItem.student!.id)} className="text-left font-medium text-blue-600 hover:underline">
                            {caseItem.student.name}
                          </button>
                          <p className="text-xs text-gray-400">{caseItem.student.studentId} · {caseItem.student.patientType === "student" ? "Student" : caseItem.student.patientType === "teacher" ? "Teacher" : "Staff"}</p>
                        </>
                      ) : (
                        <span className="text-gray-400">Archived student</span>
                      )}
                    </td>
                    <td className="max-w-xs px-5 py-3 text-gray-700">{caseItem.complaint}</td>
                    <td className="max-w-sm px-5 py-3 text-gray-700">{caseItem.assessment}</td>
                    <td className="max-w-sm px-5 py-3 text-gray-700">{caseItem.treatment}</td>
                    <td className="px-5 py-3"><ProviderBadge provider={caseItem.provider} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function ProviderBadge({
  provider,
}: {
  provider: DashboardStats["recentCases"][number]["provider"];
}) {
  if (!provider) return <span className="text-xs text-gray-400">Not assigned</span>;
  return (
    <div>
      <p className="whitespace-nowrap text-sm font-medium text-gray-800">{provider.name}</p>
      <p className="text-xs capitalize text-gray-400">{provider.role}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] animate-pulse space-y-5">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-36 rounded-xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-80 rounded-xl bg-white shadow-sm" />
        <div className="h-80 rounded-xl bg-white shadow-sm" />
      </div>
    </div>
  );
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default DashboardPage;
