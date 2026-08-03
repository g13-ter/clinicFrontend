import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS, can } from "../config/permissions";
import { useAuth } from "../hooks/useAuth";
import { useSessionExpiryWarning } from "../hooks/useSessionExpiryWarning";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import type { ClinicVisit, User } from "../utils/types";
import { clearCurrentSession } from "../utils/auth";
import { BrandLogo } from "../components/BrandLogo";
import {
  AuditIcon,
  CalendarIcon,
  CartIcon,
  CloseIcon,
  DashboardIcon,
  MenuIcon,
  MedicineIcon,
  PatientsIcon,
  ReportsIcon,
  SearchIcon,
  StaffIcon,
  VisitsIcon,
} from "../components/icons";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": DashboardIcon,
  "/clinical-workspace": VisitsIcon,
  "/patients": PatientsIcon,
  "/patient-queue": VisitsIcon,
  "/appointments": CalendarIcon,
  "/medicines": MedicineIcon,
  "/purchase-requests": CartIcon,
  "/users": StaffIcon,
  "/reports": ReportsIcon,
  "/audit-log": AuditIcon,
  "/settings": StaffIcon,
};

const EMERGENCY_POLL_INTERVAL_MS = 10_000;

function emergencyStudentName(visit: ClinicVisit): string {
  return visit.patientId && typeof visit.patientId === "object"
    ? `${visit.patientId.firstName} ${visit.patientId.lastName}`
    : "Student";
}

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const { showToast } = useToast();
  const hasSidebar = role === "admin";
  const minutesLeft = useSessionExpiryWarning();
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [emergencyVisits, setEmergencyVisits] = useState<ClinicVisit[]>([]);
  const [openingEmergency, setOpeningEmergency] = useState(false);

  useEffect(() => {
    api.get<User>("/users/me").then((response) => setProfile(response.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const markOnline = () => setOnline(true);
    const markOffline = () => setOnline(false);
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);
    return () => {
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/auth/logout", {});
    } catch {
      // Local cleanup still signs the user out if the server is unavailable.
    }
    clearCurrentSession();
    navigate("/login");
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (search.trim()) {
      const encodedSearch = encodeURIComponent(search.trim());
      if (role === "admin") {
        navigate(`/dashboard?section=management&management=students&search=${encodedSearch}`);
      } else if (role === "nurse" || role === "staff") {
        navigate(`/dashboard?view=students&search=${encodedSearch}`);
      } else {
        navigate(`/patients?search=${encodedSearch}`);
      }
    }
  };

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!role || !item.roles.includes(role)) return false;
    if (role === "admin") {
      return item.to === "/dashboard" || item.to === "/audit-log";
    }
    return true;
  });
  const canSearchStudents = can(role, "searchPatients") && role !== "doctor";
  const isClinicalRole = role === "doctor" || role === "nurse";

  useEffect(() => {
    if (!isClinicalRole) {
      setEmergencyVisits([]);
      return;
    }

    let cancelled = false;
    const fetchEmergencies = async () => {
      try {
        const response = await api.get<ClinicVisit[]>("/visits/queue");
        if (cancelled) return;
        const emergencies = response.data.filter((visit) => visit.isEmergency);
        setEmergencyVisits(emergencies);

        emergencies.forEach((visit) => {
          const notificationKey = `clinic-emergency-notified:${visit._id}`;
          if (sessionStorage.getItem(notificationKey)) return;
          sessionStorage.setItem(notificationKey, "true");
          showToast(
            `Emergency case: ${emergencyStudentName(visit)} requires immediate attention`,
            "error",
          );
        });
      } catch {
        // Page-level data remains usable if the background emergency check fails.
      }
    };

    void fetchEmergencies();
    const interval = window.setInterval(fetchEmergencies, EMERGENCY_POLL_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void fetchEmergencies();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [isClinicalRole, showToast]);

  useEffect(() => {
    if (emergencyVisits.length === 0) return;
    const previousTitle = document.title;
    document.title = `EMERGENCY (${emergencyVisits.length}) | School Clinic`;
    return () => {
      document.title = previousTitle;
    };
  }, [emergencyVisits.length]);

  const handleOpenEmergency = async () => {
    const visit = emergencyVisits[0];
    if (!visit || openingEmergency) return;

    if (role !== "doctor") {
      navigate(`/dashboard?view=visits&emergency=${visit._id}&focus=${Date.now()}`);
      return;
    }

    if (!visit.patientId || typeof visit.patientId !== "object") {
      showToast("The emergency student record could not be opened", "error");
      return;
    }

    setOpeningEmergency(true);
    try {
      if (visit.status !== "in_consultation") {
        await api.put(`/visits/${visit._id}/status`, { status: "in_consultation" });
      }

      const params = new URLSearchParams({
        tab: "consultation",
        visitId: visit._id,
        patientId: visit.patientId._id,
        complaint: visit.complaint,
      });
      if (visit.appointmentId) {
        params.set(
          "appointmentId",
          typeof visit.appointmentId === "object"
            ? visit.appointmentId._id
            : visit.appointmentId,
        );
      }
      navigate(`/clinical-workspace?${params}`);
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to open the emergency consultation",
        "error",
      );
    } finally {
      setOpeningEmergency(false);
    }
  };

  const clinicalTabs = [
    { id: "appointments", label: "Today's Appointments", icon: CalendarIcon },
    { id: "records", label: "Student Records", icon: PatientsIcon },
    { id: "consultation", label: "New Consultation", icon: VisitsIcon },
    { id: "followups", label: "Follow-Ups", icon: CalendarIcon },
  ] as const;

  const closeSidebar = () => setSidebarOpen(false);

  const navigation = (
    <nav aria-label="Main navigation" className="space-y-1 p-4">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Navigation
      </p>
      {visibleItems.map((item) => {
        const Icon = NAV_ICONS[item.to] ?? DashboardIcon;

        if (item.to === "/clinical-workspace" && isClinicalRole) {
          const clinicalActive = location.pathname === "/clinical-workspace";
          const selectedTab = new URLSearchParams(location.search).get("tab") ?? "appointments";

          return (
            <div key={item.to} className="space-y-1">
              <Link
                to="/clinical-workspace?tab=appointments"
                onClick={closeSidebar}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  clinicalActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                Clinical Care
              </Link>
              <div className="ml-5 space-y-1 border-l border-gray-200 pl-3">
                {clinicalTabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const tabActive = clinicalActive && selectedTab === tab.id;
                  return (
                    <Link
                      key={tab.id}
                      to={`/clinical-workspace?tab=${tab.id}`}
                      onClick={closeSidebar}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        tabActive
                          ? "bg-blue-600 font-medium text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <TabIcon className="h-4 w-4" />
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <header className="border-b border-gray-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-3 py-3 sm:px-6">
          {hasSidebar && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 lg:hidden"
            >
              <MenuIcon />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex shrink-0 items-center gap-3 text-left"
          >
            <BrandLogo className="h-10 w-10 drop-shadow-[0_5px_8px_rgba(37,99,235,0.18)]" />
            <span className="leading-tight">
              <span className="block text-sm font-bold text-gray-900 sm:text-base">
                School Clinic Management
              </span>
              <span className="block text-xs capitalize text-gray-500">{role} dashboard</span>
            </span>
          </button>

          {canSearchStudents && (
            <form
              onSubmit={handleSearch}
              className="relative order-last w-full sm:order-none sm:ml-auto sm:max-w-xs"
            >
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students..."
                className="input pr-9"
              />
              <button
                type="submit"
                aria-label="Search students"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                <SearchIcon />
              </button>
            </form>
          )}

          <div className={`${canSearchStudents ? "" : "ml-auto"} flex items-center gap-3`}>
            {profile && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                <p className="text-xs text-gray-500">{profile.email}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {loggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {hasSidebar && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden print:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeSidebar}
            className="absolute inset-0 bg-slate-950/40"
          />
          <aside className="relative h-full w-[min(85vw,300px)] overflow-y-auto border-r border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="font-semibold text-gray-900">School Clinic</p>
                <p className="text-xs capitalize text-gray-500">{role} workspace</p>
              </div>
              <button
                type="button"
                onClick={closeSidebar}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <CloseIcon />
              </button>
            </div>
            {navigation}
          </aside>
        </div>
      )}

      <div className="mx-auto flex max-w-[1800px] items-start">
        {hasSidebar && (
          <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white lg:block print:hidden">
            {navigation}
          </aside>
        )}

        <main className="min-w-0 flex-1 p-3 sm:p-6 print:max-w-none print:p-0">
          {emergencyVisits.length > 0 && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 flex flex-col gap-3 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-red-950 shadow-sm sm:flex-row sm:items-center"
            >
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-red-600"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  Emergency case requires immediate attention
                  {emergencyVisits.length > 1 ? ` (${emergencyVisits.length} active)` : ""}
                </p>
                <p className="mt-0.5 text-sm">
                  {emergencyStudentName(emergencyVisits[0]!)}
                  {emergencyVisits[0]?.emergencyDetails
                    ? ` — ${emergencyVisits[0].emergencyDetails}`
                    : emergencyVisits[0]?.complaint
                      ? ` — ${emergencyVisits[0].complaint}`
                      : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenEmergency}
                disabled={openingEmergency}
                className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
              >
                {openingEmergency ? "Opening..." : "Open Emergency"}
              </button>
            </div>
          )}
          {!hasSidebar && location.pathname !== "/dashboard" && (
            <Link
              to="/dashboard"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-700 print:hidden"
            >
              <span aria-hidden="true">←</span>
              Back to Dashboard
            </Link>
          )}
          {!online && (
            <div
              role="status"
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden"
            >
              You are offline. Existing information remains visible, but changes cannot be saved until your connection returns.
            </div>
          )}
          {minutesLeft !== null && (
            <div className="mb-4 flex flex-col gap-2 rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between print:hidden">
              <span>
                Your session will expire in {minutesLeft} minute{minutesLeft === 1 ? "" : "s"}.
                Please save your work.
              </span>
              <button onClick={handleLogout} className="self-start text-xs underline sm:self-auto">
                Log in again
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
