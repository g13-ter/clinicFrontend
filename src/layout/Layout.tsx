import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS, can } from "../config/permissions";
import { useAuth } from "../hooks/useAuth";
import { useSessionExpiryWarning } from "../hooks/useSessionExpiryWarning";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import type { ClinicVisit } from "../utils/types";
import { clearCurrentSession } from "../utils/auth";
import { BrandLogo } from "../components/BrandLogo";
import { TermsAgreementModal } from "../components/TermsAgreementModal";
import Modal from "../components/Modal";
import { useInAppNotifications } from "../features/notifications/useInAppNotifications";
import { useUserProfile } from "../features/profile/UserProfileContext";
import {
  AuditIcon,
  CalendarIcon,
  CartIcon,
  CloseIcon,
  DashboardIcon,
  DocumentationIcon,
  BellIcon,
  MenuIcon,
  MedicineIcon,
  PatientsIcon,
  ReportsIcon,
  SearchIcon,
  StaffIcon,
  SettingsIcon,
  VisitsIcon,
} from "../components/icons";

const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": DashboardIcon,
  "/clinical-workspace": VisitsIcon,
  "/analytics": ReportsIcon,
  "/patients": PatientsIcon,
  "/patient-queue": VisitsIcon,
  "/appointments": CalendarIcon,
  "/medicines": MedicineIcon,
  "/purchase-requests": CartIcon,
  "/users": StaffIcon,
  "/roles-permissions": AuditIcon,
  "/documentation": DocumentationIcon,
  "/reports": ReportsIcon,
  "/audit-log": AuditIcon,
  "/settings": SettingsIcon,
  "/profile": StaffIcon,
  "/dashboard?view=medications": MedicineIcon,
  "/dashboard?view=notifications": BellIcon,
  "/dashboard?tab=notifications": BellIcon,
};

type SidebarItem = {
  to: string;
  label: string;
  dashboardView?: string;
  dashboardTab?: string;
};

type SidebarGroup = {
  id: string;
  label?: string;
  items: readonly SidebarItem[];
};

const NURSE_NAV_GROUPS: readonly SidebarGroup[] = [
  { id: "primary", items: [{ to: "/dashboard", label: "Dashboard" }] },
  {
    id: "care",
    label: "Care & visits",
    items: [
      { to: "/patient-queue", label: "Patient Visits", dashboardView: "visits" },
      { to: "/patients", label: "Patients", dashboardView: "students" },
      { to: "/appointments", label: "Appointments", dashboardView: "appointments" },
      { to: "/dashboard?view=medications", label: "Medication Requests", dashboardView: "medications" },
    ],
  },
  {
    id: "supplies",
    label: "Inventory & supplies",
    items: [
      { to: "/medicines", label: "Inventory", dashboardView: "inventory" },
      { to: "/inventory-labels", label: "Manage Labels", dashboardView: "inventory-labels" },
      { to: "/purchase-requests", label: "Purchase Requests", dashboardView: "purchase-requests" },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      { to: "/analytics", label: "Analytics" },
      { to: "/reports", label: "Reports", dashboardView: "reports" },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    items: [
      { to: "/documentation", label: "Documentation", dashboardView: "documentation" },
      { to: "/settings", label: "Settings", dashboardView: "settings" },
    ],
  },
];

const DOCTOR_NAV_GROUPS: readonly SidebarGroup[] = [
  { id: "primary", items: [{ to: "/dashboard", label: "Dashboard", dashboardTab: "appointments" }] },
  {
    id: "care",
    label: "Care & visits",
    items: [
      { to: "/clinical-workspace", label: "Clinical Care" },
      { to: "/patient-queue", label: "Patient Visits" },
      { to: "/patients", label: "Patients" },
      { to: "/appointments", label: "Appointments" },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      { to: "/analytics", label: "Analytics" },
      { to: "/reports", label: "Reports" },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    items: [
      { to: "/documentation", label: "Documentation" },
      { to: "/profile", label: "My Profile" },
    ],
  },
];

const STAFF_NAV_GROUPS: readonly SidebarGroup[] = [
  { id: "primary", items: [{ to: "/dashboard", label: "Dashboard", dashboardView: "overview" }] },
  {
    id: "care",
    label: "Care & visits",
    items: [
      { to: "/patient-queue", label: "Patient Visits" },
      { to: "/patients", label: "Patients" },
      { to: "/appointments", label: "Appointments" },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    items: [{ to: "/documentation", label: "Documentation" }],
  },
];

const EMERGENCY_POLL_INTERVAL_MS = 10_000;

function emergencyStudentName(visit: ClinicVisit): string {
  return visit.patientId && typeof visit.patientId === "object"
    ? `${visit.patientId.firstName} ${visit.patientId.lastName}`
    : "Student";
}

function isSidebarItemActive(item: SidebarItem, role: string | null, pathname: string, search: string): boolean {
  const params = new URLSearchParams(search);
  const currentView = params.get("view");
  const currentTab = params.get("tab");

  if (pathname === "/dashboard") {
    if (role === "doctor") {
      if (item.to === "/clinical-workspace" && ["records", "consultation", "followups"].includes(currentTab ?? "")) return true;
      if (item.to === "/patient-queue" && currentTab === "visits") return true;
      if (item.to === "/reports" && currentTab === "reports") return true;
      if (item.to === "/analytics" && currentTab === "analytics") return true;
    }

    if (role === "staff") {
      if (item.to === "/patients" && currentView === "students") return true;
      if (item.to === "/patient-queue" && currentView === "visits") return true;
      if (item.to === "/appointments" && currentView === "appointments") return true;
    }

    if (item.dashboardTab) return (currentTab ?? "appointments") === item.dashboardTab;
    if (item.dashboardView) return (currentView ?? "overview") === item.dashboardView;
    return item.to === "/dashboard" && (!currentView || currentView === "overview");
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const { profile } = useUserProfile();
  const { showToast } = useToast();
  const hasSidebar = role === "admin" || role === "superadmin" || role === "nurse" || role === "doctor" || role === "staff";
  const minutesLeft = useSessionExpiryWarning();
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [emergencyVisits, setEmergencyVisits] = useState<ClinicVisit[]>([]);
  const [openingEmergency, setOpeningEmergency] = useState(false);
  const [reviewingTerms, setReviewingTerms] = useState(false);
  const [snoozedMedicationIds, setSnoozedMedicationIds] = useState<string[]>([]);
  const roleNotifications = useInAppNotifications(role === "nurse" || role === "doctor");
  const [collapsedNavGroups, setCollapsedNavGroups] = useState<string[]>(["supplies", "insights", "resources"]);
  const pendingMedicationOrder = role === "nurse" ? roleNotifications.items.find(
    (notification) =>
      notification.kind === "medication_order" &&
      !notification.readAt &&
      !snoozedMedicationIds.includes(notification._id),
  ) : undefined;

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

  const visibleNavGroups = useMemo<readonly SidebarGroup[]>(() => {
    if (role === "nurse") return NURSE_NAV_GROUPS;
    if (role === "doctor") return DOCTOR_NAV_GROUPS;
    if (role === "staff") return STAFF_NAV_GROUPS;
    const items = NAV_ITEMS.filter((item) => {
      if (!role || !item.roles.includes(role)) return false;
      if (role === "admin") return ["/dashboard", "/audit-log", "/documentation", "/settings"].includes(item.to);
      return true;
    });
    return [{ id: "navigation", items }];
  }, [role]);
  const canSearchStudents = can(role, "searchPatients") && role !== "doctor";
  const showNotificationButton = role === "nurse" || role === "doctor" || role === "staff";
  const notificationCount = role === "nurse" || role === "doctor" ? roleNotifications.unreadCount : 0;
  const notificationPath = role === "doctor" ? "/dashboard?tab=notifications" : "/dashboard?view=notifications";
  const notificationsActive = location.pathname === "/dashboard" && (
    role === "doctor"
      ? new URLSearchParams(location.search).get("tab") === "notifications"
      : new URLSearchParams(location.search).get("view") === "notifications"
  );
  const isClinicalRole = role === "doctor" || role === "nurse";
  const dashboardView = new URLSearchParams(location.search).get("view");
  const activeNavGroupId = visibleNavGroups.find((group) =>
    group.items.some((item) => isSidebarItemActive(item, role, location.pathname, location.search)),
  )?.id;
  const isPatientQueueVisible =
    location.pathname === "/patient-queue" ||
    (location.pathname === "/dashboard" && dashboardView === "visits");

  useEffect(() => {
    if (!activeNavGroupId) return;
    const defaultOpenGroupId = activeNavGroupId === "primary" ? "care" : activeNavGroupId;
    setCollapsedNavGroups(
      visibleNavGroups
        .filter((group) => group.label && group.id !== defaultOpenGroupId)
        .map((group) => group.id),
    );
  }, [activeNavGroupId, location.pathname, location.search, visibleNavGroups]);

  useEffect(() => {
    if (!isClinicalRole || isPatientQueueVisible) {
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
  }, [isClinicalRole, isPatientQueueVisible, showToast]);

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
      });
      if (visit.appointmentId) {
        params.set(
          "appointmentId",
          typeof visit.appointmentId === "object"
            ? visit.appointmentId._id
            : visit.appointmentId,
        );
      }
      navigate(`/dashboard?${params}`);
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to open the emergency consultation",
        "error",
      );
    } finally {
      setOpeningEmergency(false);
    }
  };

  const snoozeMedicationOrder = () => {
    if (!pendingMedicationOrder) return;
    const notificationId = pendingMedicationOrder._id;
    setSnoozedMedicationIds((current) => [...new Set([...current, notificationId])]);
    window.setTimeout(() => {
      setSnoozedMedicationIds((current) => current.filter((id) => id !== notificationId));
    }, 5 * 60_000);
  };

  const openMedicationOrder = () => {
    if (!pendingMedicationOrder) return;
    snoozeMedicationOrder();
    navigate("/dashboard?view=medications");
  };

  const clinicalTabs = [
    { id: "appointments", label: "Today's Appointments", icon: CalendarIcon },
    { id: "records", label: "Patient Records", icon: PatientsIcon },
    { id: "followups", label: "Follow-Ups", icon: CalendarIcon },
  ] as const;

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  const navigation = (
    <nav aria-label="Main navigation" className="space-y-3 p-4">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {role === "nurse" || role === "doctor" || role === "staff" ? `${role[0]!.toUpperCase()}${role.slice(1)} workspace` : "Navigation"}
      </p>
      {visibleNavGroups.map((group) => {
        const groupContent = group.items.map((item) => {
        const Icon = NAV_ICONS[item.to] ?? DashboardIcon;
        const isActive = isSidebarItemActive(item, role, location.pathname, location.search);

        if (item.to === "/clinical-workspace" && isClinicalRole) {
          const clinicalActive = location.pathname === "/clinical-workspace";
          const selectedTab = new URLSearchParams(location.search).get("tab") ?? "appointments";

          return (
            <div key={item.to} className="space-y-1">
              <Link
                to="/clinical-workspace?tab=appointments"
                onClick={closeSidebar}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
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
                      className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
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

        return role === "nurse" || role === "doctor" || role === "staff" ? (
          <Link
            key={item.to}
            to={item.to}
            onClick={closeSidebar}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="min-w-0 flex-1">{item.label}</span>
          </Link>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={closeSidebar}
            className={({ isActive: navActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                navActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        );
        });

        if (!group.label) return <div key={group.id}>{groupContent}</div>;
        const expanded = !collapsedNavGroups.includes(group.id);
        const hasActiveItem = group.items.some((item) =>
          isSidebarItemActive(item, role, location.pathname, location.search),
        );

        return (
          <section key={group.id}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={`navigation-${group.id}`}
              onClick={() => setCollapsedNavGroups((current) => expanded
                ? [...current, group.id]
                : current.filter((id) => id !== group.id))}
              className={`flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                hasActiveItem ? "text-blue-700 hover:bg-blue-50" : "text-slate-500 hover:bg-gray-100 hover:text-slate-800"
              }`}
            >
              {group.label}
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}>
                <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {expanded && <div id={`navigation-${group.id}`} className="mt-1 space-y-1">{groupContent}</div>}
          </section>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 print:bg-white">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[70] -translate-y-20 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white focus:translate-y-0"
      >
        Skip to main content
      </a>
      <header className="border-b border-gray-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6">
          {hasSidebar && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              aria-controls="mobile-navigation"
              aria-expanded={sidebarOpen}
              className="min-h-11 min-w-11 rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 lg:hidden"
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
                Basic Clinic
              </span>
            </span>
          </button>

          {canSearchStudents && (
            <form
              onSubmit={handleSearch}
              className="relative order-last w-full lg:order-none lg:ml-auto lg:max-w-xs"
            >
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patients..."
                className="input pr-9"
              />
              <button
                type="submit"
                aria-label="Search patients"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                <SearchIcon />
              </button>
            </form>
          )}

          <div className={`${canSearchStudents ? "" : "ml-auto"} flex shrink-0 items-center gap-2 sm:gap-3`}>
            {showNotificationButton && (
              <button
                type="button"
                onClick={() => navigate(notificationPath)}
                aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : "Notifications"}
                aria-current={notificationsActive ? "page" : undefined}
                className={`relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border transition-colors ${
                  notificationsActive
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-700"
                }`}
              >
                <BellIcon />
                <span className="sr-only">Notifications</span>
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </button>
            )}
            <div className="hidden w-40 shrink-0 text-right lg:block">
              {profile ? (
                <>
                  <p className="truncate text-sm font-semibold text-gray-900" title={profile.name}>{profile.name}</p>
                  <p className="truncate text-xs text-gray-500" title={profile.email}>{profile.email}</p>
                </>
              ) : (
                <div className="h-8" aria-hidden="true" />
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="min-h-11 rounded-lg border border-gray-200 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 sm:px-3"
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
          <aside id="mobile-navigation" className="relative h-full w-[min(85vw,300px)] overflow-y-auto border-r border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="font-semibold text-gray-900">School Clinic</p>
            <p className="text-xs capitalize text-gray-500">{role} workspace</p>
              </div>
              <button
                type="button"
                onClick={closeSidebar}
                aria-label="Close navigation"
                className="min-h-11 min-w-11 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <CloseIcon />
              </button>
            </div>
            {navigation}
          </aside>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1800px] flex-1 items-stretch">
        {hasSidebar && (
          <aside className="sticky top-[65px] hidden h-[calc(100vh-65px)] w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white lg:block print:hidden">
            {navigation}
          </aside>
        )}

        <main id="main-content" tabIndex={-1} className="flex min-w-0 flex-1 flex-col p-3 sm:p-6 print:max-w-none print:p-0">
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
          <footer className="mt-auto flex flex-col gap-2 border-t border-gray-200 pt-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <span>✓ You have read and accepted the Terms and Agreement.</span>
            <button type="button" onClick={() => setReviewingTerms(true)} className="self-start font-medium text-blue-600 hover:underline sm:self-auto">
              View Terms Again
            </button>
          </footer>
        </main>
      </div>
      {reviewingTerms && (
        <TermsAgreementModal
          busy={false}
          error=""
          reviewOnly
          onAccept={() => setReviewingTerms(false)}
          onDecline={() => setReviewingTerms(false)}
        />
      )}
      {pendingMedicationOrder && (
        <Modal
          title={pendingMedicationOrder.title}
          onClose={snoozeMedicationOrder}
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium leading-6 text-blue-950">
                {pendingMedicationOrder.message}
              </p>
            </div>
            <p className="text-xs leading-5 text-gray-500">
              Open the medication queue to review the student record and safety alerts, accept the request, and complete the required administration checklist.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                onClick={snoozeMedicationOrder}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Remind Me Later
              </button>
              <button
                type="button"
                onClick={openMedicationOrder}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Open Medication Queue
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Layout;
