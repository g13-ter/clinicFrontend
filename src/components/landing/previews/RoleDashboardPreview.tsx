import type { ReactNode } from "react";

import { BrandLogo } from "../../BrandLogo";

import {
  AuditIcon,
  CalendarIcon,
  DashboardIcon,
  PatientsIcon,
  ProfileIcon,
  SettingsIcon,
  StaffIcon,
  VisitsIcon,
} from "../../icons";

import type { ClinicRole } from "../../../data/landingData";
import { roleWorkspaces } from "../../../data/landingData";

import RoleAnalyticsPreview from "./RoleAnalyticsPreview";

import {
  RoleAdminContent,
  RoleDoctorContent,
  RoleNurseContent,
  RoleStaffContent,
} from "./RoleContents";

/* =========================================================
   MAIN ROLE DASHBOARD PREVIEW
========================================================= */

export default function RoleDashboardPreview({
  role,
}: {
  role: ClinicRole;
}) {
  const workspace = roleWorkspaces[role];

  const users: Record<ClinicRole, [string, string]> = {
    admin: [
      "Admin User",
      "admin@clinic.com",
    ],

    doctor: [
      "Doctor",
      "doctor@clinic.com",
    ],

    nurse: [
      "Nurse",
      "nurse@clinic.com",
    ],

    staff: [
      "Staff",
      "staff@clinic.com",
    ],
  };

  const [name, email] = users[role];

  /*
    Based on the actual dashboard layouts:

    Admin  = has sidebar
    Doctor = no sidebar
    Nurse  = no sidebar
    Staff  = no sidebar
  */
  const hasSidebar = role === "admin";

  return (
    <article className="relative overflow-hidden rounded-[24px] border border-white bg-[#f8fafc] text-slate-950 shadow-[0_28px_70px_rgba(30,64,175,0.16)] ring-1 ring-blue-100/80">
      {/* TOP BAR */}
      <PreviewHeader
        name={name}
        email={email}
      />

      {/* ADMIN */}
      {hasSidebar ? (
        <div className="grid h-[545px] overflow-hidden sm:grid-cols-[128px_1fr]">
          <AdminSidebar
            navigation={workspace.navigation}
          />

          <RoleDashboardBody
            role={role}
          />
        </div>
      ) : (
        /* DOCTOR / NURSE / STAFF */
        <div className="h-[545px] overflow-hidden">
          <RoleDashboardBody
            role={role}
          />
        </div>
      )}
    </article>
  );
}

/* =========================================================
   PREVIEW HEADER
========================================================= */

function PreviewHeader({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <div className="flex h-14 items-center border-b border-slate-200 bg-white px-4 sm:h-16 sm:px-5">
      {/* LOGO */}
      <BrandLogo className="mr-2 h-8 w-8 sm:h-9 sm:w-9" />

      {/* SYSTEM NAME */}
      <p className="whitespace-nowrap text-[10px] font-extrabold sm:text-[13px]">
        School Clinic Management
      </p>

      {/* SEARCH */}
      <div className="ml-auto hidden h-8 w-[34%] items-center rounded-md border border-slate-200 bg-white px-3 text-[7px] text-slate-400 md:flex">
        Search patients...

        <span className="ml-auto">
          ⌕
        </span>
      </div>

      {/* USER INFO */}
      <div className="ml-3 text-right">
        <p className="text-[8px] font-medium sm:text-[9px]">
          {name}
        </p>

        <p className="text-[6px] text-slate-400 sm:text-[7px]">
          {email}
        </p>
      </div>

      {/* LOGOUT */}
      <span className="ml-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[7px] text-slate-600 sm:text-[8px]">
        Logout
      </span>
    </div>
  );
}

/* =========================================================
   ADMIN SIDEBAR

   Admin navigation:
   - Dashboard
   - Audit Logs
   - Settings
   - Profile
========================================================= */

function AdminSidebar({
  navigation,
}: {
  navigation: string[];
}) {
  return (
    <aside className="hidden border-r border-slate-200 bg-white p-3 sm:block">
      <p className="px-2 py-2 text-[7px] font-medium uppercase tracking-[0.1em] text-slate-400">
        Navigation
      </p>

      {navigation.map(
        (item, index) => (
          <div
            key={item}
            className={`mt-1 flex items-center gap-2 rounded-md px-2.5 py-2 text-[8px] font-medium ${
              index === 0
                ? "bg-blue-600 text-white"
                : "text-slate-600"
            }`}
          >
            <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">
              {previewNavigationIcon(
                item,
              )}
            </span>

            {item}
          </div>
        ),
      )}
    </aside>
  );
}

/* =========================================================
   ROLE DASHBOARD BODY
========================================================= */

function RoleDashboardBody({
  role,
}: {
  role: ClinicRole;
}) {
  const workspace =
    roleWorkspaces[role];

  /*
    Active dashboard tab based on screenshots.

    Admin  = Management
    Doctor = Appointments
    Nurse  = Patient Visits
    Staff  = Patient Visits
  */
  const activeTab =
    role === "staff"
      ? 1
      : role === "nurse"
        ? 1
        : 0;

  const metricIcons =
    getMetricIcons(role);

  const metricTones =
    getMetricTones(role);

  return (
    <div className="min-w-0 p-3 sm:p-4 lg:p-5">
      {/* DASHBOARD TITLE */}
      <h3 className="text-[15px] font-medium tracking-tight sm:text-[18px]">
        {workspace.eyebrow}
      </h3>

      {/* =================================================
          ANALYTICS

          Doctor = yes
          Nurse  = yes
          Admin  = no
          Staff  = no
      ================================================= */}
      {(role === "doctor" ||
        role === "nurse") && (
        <RoleAnalyticsPreview />
      )}

      {/* =================================================
          METRIC CARDS
      ================================================= */}
      <div
        className={`mt-3 grid gap-2 ${
          role === "admin"
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-2 xl:grid-cols-4"
        }`}
      >
        {workspace.metrics.map(
          (
            [
              value,
              label,
              caption,
            ],
            index,
          ) => (
            <RoleMetricCard
              key={label}
              value={value}
              label={label}
              caption={caption}
              icon={
                metricIcons[index]
              }
              tone={
                metricTones[index]
              }
            />
          ),
        )}
      </div>

      {/* =================================================
          ROLE TABS
      ================================================= */}
      <div className="mt-3 flex overflow-x-auto rounded-lg border border-slate-200 bg-white text-[7px] font-medium text-slate-600 sm:text-[8px]">
        {workspace.features.map(
          (
            feature,
            index,
          ) => (
            <span
              key={feature}
              className={`relative shrink-0 whitespace-nowrap px-3 py-2.5 sm:px-4 ${
                index === activeTab
                  ? "border-b-2 border-blue-600 bg-blue-50/50 text-blue-600"
                  : ""
              }`}
            >
              {feature}
            </span>
          ),
        )}
      </div>

      {/* =================================================
          ROLE-SPECIFIC CONTENT
      ================================================= */}

      {role === "admin" && (
        <RoleAdminContent />
      )}

      {role === "doctor" && (
        <RoleDoctorContent />
      )}

      {role === "nurse" && (
        <RoleNurseContent />
      )}

      {role === "staff" && (
        <RoleStaffContent />
      )}
    </div>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

type MetricTone =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "red";

function RoleMetricCard({
  value,
  label,
  caption,
  icon,
  tone,
}: {
  value: string;
  label: string;
  caption: string;
  icon: ReactNode;
  tone: MetricTone;
}) {
  const tones: Record<
    MetricTone,
    string
  > = {
    blue:
      "bg-blue-50 text-blue-600",

    green:
      "bg-emerald-50 text-emerald-600",

    purple:
      "bg-violet-50 text-violet-600",

    orange:
      "bg-orange-50 text-orange-600",

    red:
      "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        {/* LABEL */}
        <p className="truncate text-[7px] font-medium text-slate-600 sm:text-[8px]">
          {label}
        </p>

        {/* ICON */}
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md [&>svg]:h-3.5 [&>svg]:w-3.5 ${tones[tone]}`}
        >
          {icon}
        </span>
      </div>

      {/* VALUE */}
      <p className="mt-2 text-lg font-medium">
        {value}
      </p>

      {/* DESCRIPTION */}
      <p className="mt-1 truncate text-[6px] text-slate-400 sm:text-[7px]">
        {caption}
      </p>
    </div>
  );
}

/* =========================================================
   METRIC ICONS
========================================================= */

function getMetricIcons(
  role: ClinicRole,
): ReactNode[] {
  /* ADMIN */
  if (role === "admin") {
    return [
      <PatientsIcon key="patients" />,

      <StaffIcon key="users" />,
    ];
  }

  /* STAFF */
  if (role === "staff") {
    return [
      <PatientsIcon key="patients" />,

      <VisitsIcon key="visits" />,

      <StaffIcon key="waiting" />,

      <CalendarIcon key="appointments" />,
    ];
  }

  /*
    DOCTOR + NURSE
  */
  return [
    <CalendarIcon key="appointments" />,

    <PatientsIcon key="patients" />,

    <VisitsIcon key="consultations" />,

    <VisitsIcon key="emergency" />,
  ];
}

/* =========================================================
   METRIC COLORS
========================================================= */

function getMetricTones(
  role: ClinicRole,
): MetricTone[] {
  /* ADMIN */
  if (role === "admin") {
    return [
      "blue",
      "purple",
    ];
  }

  /* STAFF */
  if (role === "staff") {
    return [
      "blue",
      "green",
      "purple",
      "orange",
    ];
  }

  /*
    DOCTOR + NURSE
  */
  return [
    "blue",
    "orange",
    "green",
    "red",
  ];
}

/* =========================================================
   ADMIN SIDEBAR ICONS
========================================================= */

function previewNavigationIcon(
  item: string,
) {
  if (item === "Dashboard") {
    return <DashboardIcon />;
  }

  if (
    item === "Audit Log" ||
    item === "Audit Logs"
  ) {
    return <AuditIcon />;
  }

  if (item === "Settings") {
    return <SettingsIcon />;
  }

  if (item === "Profile") {
    return <ProfileIcon />;
  }

  return <DashboardIcon />;
}
