import { type ReactNode } from "react";

import { BrandLogo } from "../../BrandLogo";

import {
  AuditIcon,
  BellIcon,
  CalendarIcon,
  CartIcon,
  DashboardIcon,
  DocumentationIcon,
  MedicineIcon,
  PatientsIcon,
  ProfileIcon,
  ReportsIcon,
  SettingsIcon,
  StaffIcon,
  VisitsIcon,
} from "../../icons";

import type { ClinicRole } from "../../../data/landingData";
import { roleWorkspaces } from "../../../data/landingData";

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

  return (
    <article className="relative overflow-hidden rounded-[24px] border border-white bg-[#f8fafc] text-slate-950 shadow-[0_28px_70px_rgba(30,64,175,0.16)] ring-1 ring-blue-100/80">
      {/* TOP BAR */}
      <PreviewHeader
        name={name}
        email={email}
        showNotifications={role === "doctor" || role === "nurse" || role === "staff"}
      />

      <div className="grid h-[545px] overflow-hidden sm:grid-cols-[128px_1fr]">
        <RoleSidebar role={role} navigation={workspace.navigation} />
        <RoleDashboardBody role={role} />
      </div>
    </article>
  );
}

/* =========================================================
   PREVIEW HEADER
========================================================= */

function PreviewHeader({
  name,
  email,
  showNotifications,
}: {
  name: string;
  email: string;
  showNotifications: boolean;
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

      {showNotifications && (
        <span className="relative ml-auto mr-1 rounded-md border border-slate-200 p-1.5 text-slate-600 [&>svg]:h-4 [&>svg]:w-4">
          <BellIcon />
          <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-600 px-1 text-[6px] font-bold text-white">3</span>
        </span>
      )}

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
   ROLE SIDEBAR
========================================================= */

function RoleSidebar({
  role,
  navigation,
}: {
  role: ClinicRole;
  navigation: string[];
}) {
  const groups: { label?: string; items: string[] }[] = role === "nurse"
    ? [
      { items: ["Dashboard"] },
      { label: "Care & visits", items: ["Patient Visits", "Patients", "Appointments", "Medication Requests"] },
      { label: "Inventory & supplies", items: ["Inventory", "Manage Labels", "Purchase Requests"] },
      { label: "Insights", items: ["Analytics", "Reports"] },
      { label: "Resources", items: ["Documentation", "Settings"] },
    ]
    : role === "doctor"
      ? [
        { items: ["Dashboard"] },
        { label: "Care & visits", items: ["Clinical Care", "Patient Visits", "Patients", "Appointments"] },
        { label: "Insights", items: ["Analytics", "Reports"] },
        { label: "Resources", items: ["Documentation"] },
      ]
      : role === "staff"
        ? [{ items: navigation }]
        : [{ items: navigation }];

  return (
    <aside className="hidden overflow-y-auto border-r border-slate-200 bg-white p-3 sm:block">
      <p className="px-2 py-2 text-[7px] font-medium uppercase tracking-[0.1em] text-slate-400">
        {role} workspace
      </p>

      {groups.map((group, groupIndex) => (
        <div key={group.label ?? `group-${groupIndex}`} className="mt-2">
          {group.label && <p className="px-2 py-1 text-[6px] font-semibold uppercase tracking-[0.08em] text-slate-400">{group.label}</p>}
          {group.items.map((item) => (
            <div
              key={item}
              className={`mt-1 flex items-center gap-2 rounded-md px-2.5 py-2 text-[8px] font-medium ${
                item === "Dashboard" ? "bg-blue-600 text-white" : "text-slate-600"
              }`}
            >
              <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{previewNavigationIcon(item)}</span>
              {item}
            </div>
          ))}
        </div>
      ))}
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
          METRIC CARDS
      ================================================= */}
      {workspace.metrics.length > 0 && (
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
      )}

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
      <CalendarIcon key="appointments" />,

      <VisitsIcon key="waiting" />,

      <StaffIcon key="visits" />,

      <PatientsIcon key="patients" />,
    ];
  }

  if (role === "doctor") {
    return [
      <CalendarIcon key="appointments" />,
      <PatientsIcon key="patients" />,
      <VisitsIcon key="consultations" />,
      <VisitsIcon key="emergency" />,
    ];
  }

  /* NURSE */
  return [
    <CalendarIcon key="appointments" />,

    <PatientsIcon key="patients" />,

    <VisitsIcon key="consultations" />,

    <MedicineIcon key="inventory" />,
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
      "orange",
      "green",
      "purple",
    ];
  }

  /* NURSE */
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

  if (item === "Clinical Care" || item === "Patient Visits") {
    return <VisitsIcon />;
  }

  if (item === "Patients" || item === "Patient Records") {
    return <PatientsIcon />;
  }

  if (item === "Appointments") {
    return <CalendarIcon />;
  }

  if (item === "Inventory" || item === "Manage Labels" || item === "Medication Requests") {
    return <MedicineIcon />;
  }

  if (item === "Purchase Requests") {
    return <CartIcon />;
  }

  if (item === "Reports" || item === "Analytics") {
    return <ReportsIcon />;
  }

  if (item === "Notifications") {
    return <BellIcon />;
  }

  if (item === "Documentation") {
    return <DocumentationIcon />;
  }

  if (item === "Profile") {
    return <ProfileIcon />;
  }

  return <DashboardIcon />;
}
