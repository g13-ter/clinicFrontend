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
import type { Appointment, ClinicVisit, DashboardStats, Patient } from "../utils/types";
import {
  buildDashboardAlerts,
  dashboardAlertKey,
  type DashboardAlert,
} from "../utils/dashboardAlerts";
import AdminSectionTabs from "../components/AdminSectionTabs";
import DoctorWorkspaceTabs from "../components/DoctorWorkspaceTabs";
import { useToast } from "../hooks/useToast";
import { useDashboardData } from "../features/dashboard/useDashboardData";
import PatientQueuePage from "./PatientQueuePage";
import AppointmentsPage from "./AppointmentsPage";
import ClinicalWorkspacePage from "./ClinicalWorkspacePage";
import MedicinesPage from "./MedicinesPage";
import UsersPage from "./UsersPage";
import ReportsPage from "./ReportsPage";
import PatientsPage from "./PatientsPage";
import type { DoctorWorkspaceTab } from "../components/DoctorWorkspaceTabs";

const CHART_COLORS = ["#2563eb", "#14b8a6", "#f59e0b", "#f97316", "#8b5cf6"];

function DashboardPage() {
  const { role, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { stats, todayAppointments, error } = useDashboardData(role, user?.id);
  const alertStorageKey = `clinic-seen-alerts:${role ?? "unknown"}`;
  const [seenAlertKeys, setSeenAlertKeys] = useState<string[]>(() =>
    readSeenAlertKeys(alertStorageKey),
  );

  const alerts = stats ? buildDashboardAlerts(role, stats) : [];
  const unreadCount = alerts.filter(
    (alert) => !seenAlertKeys.includes(dashboardAlertKey(alert)),
  ).length;
  const requestedView = searchParams.get("view");
  const workspaceView =
    requestedView === "students" ||
    requestedView === "appointments" ||
    requestedView === "inventory" ||
    requestedView === "notifications"
      ? requestedView
      : "visits";
  const requestedDoctorTab = searchParams.get("tab");
  const doctorTab: DoctorWorkspaceTab =
    requestedDoctorTab === "visits" ||
    requestedDoctorTab === "records" ||
    requestedDoctorTab === "consultation" ||
    requestedDoctorTab === "followups"
      ? requestedDoctorTab
      : "appointments";
  const requestedAdminSection = searchParams.get("section");
  const adminSection =
    requestedAdminSection === "inventory" ||
    requestedAdminSection === "management" ||
    requestedAdminSection === "reports"
      ? requestedAdminSection
      : "analytics";

  const openNotifications = () => {
    const currentKeys = alerts.map(dashboardAlertKey);
    localStorage.setItem(alertStorageKey, JSON.stringify(currentKeys));
    setSeenAlertKeys(currentKeys);
    setSearchParams({ view: "notifications" }, { replace: true });
  };

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
  const activeClinicalTeam = stats.usersByRole.doctor + stats.usersByRole.nurse;
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

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isClinicalRole ? (
              <>
                <StatCard label="Today's Appointments" value={stats.todaysAppointments} caption="Scheduled today" icon={<CalendarIcon />} tone="blue" />
                <StatCard label="Students Waiting" value={stats.waitingPatients} caption="In the clinic queue" icon={<PatientsIcon />} tone="orange" />
                <StatCard label="Consultations Today" value={stats.consultationsToday} caption="Started or completed" icon={<VisitsIcon />} tone="green" />
                <StatCard label="Emergency Cases" value={stats.emergencyCasesToday} caption="Recorded today" icon={<VisitsIcon />} tone="red" />
              </>
            ) : isStaff ? (
              <>
                <StatCard label="Total Students" value={stats.totalStudents} caption="Active student records" icon={<PatientsIcon />} tone="blue" />
                <StatCard label="Visits Today" value={stats.todayVisits} caption="Recorded today" icon={<VisitsIcon />} tone="green" />
                <StatCard label="Students Waiting" value={stats.waitingPatients} caption="In the clinic queue" icon={<StaffIcon />} tone="purple" />
                <StatCard label="Pending Appointments" value={stats.pendingAppointments} caption="Awaiting confirmation" icon={<CalendarIcon />} tone="orange" />
              </>
            ) : (
              <>
                <StatCard label="Total Students" value={stats.totalStudents} caption="Active student records" icon={<PatientsIcon />} tone="blue" />
                <StatCard label="Clinic Visits Today" value={stats.todayVisits} caption="Recorded today" icon={<VisitsIcon />} tone="green" />
                <StatCard label="Active Doctor / Nurse" value={activeClinicalTeam} caption="Currently available" icon={<StaffIcon />} tone="purple" />
                <StatCard label="Pending Appointments" value={stats.pendingAppointments} caption="Awaiting confirmation" icon={<CalendarIcon />} tone="orange" />
              </>
            )}
          </section>

          {isAdmin && <AdminSectionTabs active={adminSection} />}

          {isDoctor && <DoctorWorkspaceTabs active={doctorTab} />}

          {!isAdmin && !isDoctor && (
            <RoleWorkspaceTabs
              role={role}
              unreadCount={unreadCount}
              activeView={workspaceView}
              onOpenNotifications={openNotifications}
            />
          )}
        </div>

        {!isAdmin && !isDoctor ? (
          workspaceView === "notifications" ? (
            <NotificationsPanel alerts={alerts} />
          ) : workspaceView === "students" ? (
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <PatientsPage embedded />
            </section>
          ) : workspaceView === "inventory" ? (
            <MedicinesPage embedded />
          ) : workspaceView === "appointments" ? (
            <AppointmentsPage embedded />
          ) : (
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <PatientQueuePage embedded />
            </section>
          )
        ) : isDoctor ? (
          doctorTab === "appointments" ? (
            <>
              <TodayAppointments appointments={todayAppointments} />
              <RecentCases cases={stats.recentCases} title="Recent Consultations" />
            </>
          ) : doctorTab === "visits" ? (
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <PatientQueuePage embedded />
            </section>
          ) : (
            <ClinicalWorkspacePage embedded />
          )
        ) : isAdmin ? (
          adminSection === "inventory" ? (
            <MedicinesPage embedded />
          ) : adminSection === "management" ? (
            <UsersPage embedded />
          ) : adminSection === "reports" ? (
            <ReportsPage embedded />
          ) : (
            <>
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <CommonComplaintsChart items={stats.commonComplaints} />
                <MonthlyVisitsChart items={stats.monthlyVisits} />
              </section>
              <ActiveTeam users={stats.activeUsers} counts={stats.usersByRole} />
              <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <h3 className="font-semibold text-emerald-950">Student privacy protected</h3>
                <p className="mt-1 text-sm text-emerald-800">
                  Admin analytics use aggregate clinic totals. Individual complaints, assessments,
                  treatments, and medical histories are limited to authorized clinical roles.
                </p>
              </section>
            </>
          )
        ) : null}
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
  onOpenNotifications,
}: {
  role: string | null;
  unreadCount: number;
  activeView: "students" | "visits" | "appointments" | "inventory" | "notifications";
  onOpenNotifications: () => void;
}) {
  const tabs = [
    { label: "Students", to: "/dashboard?view=students", view: "students", roles: ["nurse", "staff"] },
    { label: "Student Visits", to: "/dashboard?view=visits", view: "visits", roles: ["nurse", "staff"] },
    { label: "Appointments", to: "/dashboard?view=appointments", view: "appointments", roles: ["nurse", "staff"] },
    { label: "Inventory", to: "/dashboard?view=inventory", view: "inventory", roles: ["nurse"] },
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
    <article className="flex h-36 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <span className={`rounded-lg p-2 ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="mt-auto">
        <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{caption}</p>
      </div>
    </article>
  );
}

function CommonComplaintsChart({
  items,
}: {
  items: DashboardStats["commonComplaints"];
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  let current = 0;
  const segments = items.map((item, index) => {
    const start = current;
    current += total > 0 ? (item.count / total) * 100 : 0;
    return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${current}%`;
  });
  const background = total > 0 ? `conic-gradient(${segments.join(", ")})` : "#e5e7eb";

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-semibold text-gray-900">Most Common Complaints</h3>
        <p className="mt-1 text-xs text-gray-500">Based on recorded clinic visits</p>
      </div>
      {items.length === 0 ? (
        <EmptyChart label="No clinic complaints recorded yet." />
      ) : (
        <div className="mt-6 flex flex-col items-center gap-7 sm:flex-row sm:justify-center">
          <div
            className="relative h-48 w-48 shrink-0 rounded-full"
            style={{ background }}
            aria-label="Common complaints chart"
          >
            <div className="absolute inset-12 flex items-center justify-center rounded-full bg-white text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
                <p className="text-[11px] text-gray-500">recorded visits</p>
              </div>
            </div>
          </div>
          <div className="grid w-full gap-3 sm:max-w-xs">
            {items.map((item, index) => (
              <div key={item.label} className="flex items-center gap-3 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-gray-700">{item.label}</span>
                <span className="font-medium text-gray-900">
                  {Math.round((item.count / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function MonthlyVisitsChart({
  items,
}: {
  items: DashboardStats["monthlyVisits"];
}) {
  const max = Math.max(...items.map((item) => item.visits), 1);

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-semibold text-gray-900">Monthly Clinic Visits</h3>
        <p className="mt-1 text-xs text-gray-500">Last six months</p>
      </div>
      <div className="mt-6 flex h-64 items-end gap-2 border-b border-l border-gray-200 px-3 pt-4 sm:gap-4">
        {items.map((item) => (
          <div key={item.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            <div className="flex min-h-0 flex-1 items-end">
              <div
                className="group relative w-full rounded-t bg-blue-500 transition-colors hover:bg-blue-600"
                style={{ height: item.visits > 0 ? `${Math.max((item.visits / max) * 100, 5)}%` : "2px" }}
              >
                <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                  {item.visits}
                </span>
              </div>
            </div>
            <div className="h-8 pt-2 text-center text-xs text-gray-500">{item.month}</div>
          </div>
        ))}
      </div>
    </article>
  );
}

function ActiveTeam({
  users,
  counts,
}: {
  users: DashboardStats["activeUsers"];
  counts: DashboardStats["usersByRole"];
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Active Clinic Team</h3>
          <p className="mt-1 text-xs text-gray-500">
            Available doctors, nurses, and support staff
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <CountBadge label="Doctors" value={counts.doctor} tone="violet" />
          <CountBadge label="Nurses" value={counts.nurse} tone="blue" />
          <CountBadge label="Staff" value={counts.staff} tone="slate" />
        </div>
      </div>

      {users.length === 0 ? (
        <p className="mt-6 rounded-lg bg-gray-50 py-8 text-center text-sm text-gray-500">
          No team members are currently marked available.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <article key={user.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700">
                  {initials(user.name)}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
                <span className="ml-auto rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium capitalize text-gray-600">
                  {user.role}
                </span>
              </div>
              {user.scheduleNotes && (
                <p className="mt-3 border-t pt-3 text-xs text-gray-500">{user.scheduleNotes}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
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
      showToast("Student record is unavailable.");
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
        showToast("Waiting for nurse check-in and triage before consultation");
        return;
      }

      const currentVisit = linkedVisit ??
        (await api.get<ClinicVisit>(`/visits/${visitId}`)).data;
      if (!currentVisit.readyForDoctor) {
        showToast("A nurse must record triage and mark the student ready first");
        return;
      }
      await api.put(`/visits/${visitId}/status`, { status: "in_consultation" });
      const params = new URLSearchParams({
        tab: "consultation",
        appointmentId: appointment._id,
        visitId,
        patientId: student._id,
        complaint: appointment.reason,
      });
      navigate(`/dashboard?${params}`);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : "Failed to start consultation");
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
      showToast(error instanceof Error ? error.message : "Failed to confirm appointment");
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
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Student ID</th>
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
                    <td className="px-5 py-4">{student ? `${student.firstName} ${student.lastName}` : "Unknown student"}</td>
                    <td className="px-5 py-4 font-mono text-xs">{student?.studentId ?? "—"}</td>
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
}: {
  cases: DashboardStats["recentCases"];
  title?: string;
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
                      <Link to={`/patients/${caseItem.student.id}`} className="font-medium text-blue-600 hover:underline">
                        {caseItem.student.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-700">Archived student</span>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(caseItem.date).toLocaleDateString()}
                    </p>
                  </div>
                  {!doctorView && <ProviderBadge provider={caseItem.provider} />}
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
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Complaint</th>
                  <th className="px-5 py-3 font-medium">{doctorView ? "Diagnosis" : "Assessment / Findings"}</th>
                  <th className="px-5 py-3 font-medium">Treatment</th>
                  {!doctorView && <th className="px-5 py-3 font-medium">Doctor / Nurse</th>}
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
                          <Link to={`/patients/${caseItem.student.id}`} className="font-medium text-blue-600 hover:underline">
                            {caseItem.student.name}
                          </Link>
                          <p className="text-xs text-gray-400">{caseItem.student.studentId}</p>
                        </>
                      ) : (
                        <span className="text-gray-400">Archived student</span>
                      )}
                    </td>
                    <td className="max-w-xs px-5 py-3 text-gray-700">{caseItem.complaint}</td>
                    <td className="max-w-sm px-5 py-3 text-gray-700">{caseItem.assessment}</td>
                    <td className="max-w-sm px-5 py-3 text-gray-700">{caseItem.treatment}</td>
                    {!doctorView && <td className="px-5 py-3"><ProviderBadge provider={caseItem.provider} /></td>}
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

function CountBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "violet" | "blue" | "slate";
}) {
  const tones = {
    violet: "bg-violet-50 text-violet-700",
    blue: "bg-blue-50 text-blue-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return <span className={`rounded-full px-3 py-1.5 ${tones[tone]}`}>{label} {value}</span>;
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="mt-6 flex h-64 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
      {label}
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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default DashboardPage;
