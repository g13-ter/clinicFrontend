import type { ReactNode } from "react";

import { BrandLogo } from "../../BrandLogo";

import {
  AuditIcon,
  DashboardIcon,
  PatientsIcon,
  ProfileIcon,
  SettingsIcon,
  StaffIcon,
} from "../../icons";

/* =========================================================
   ADMIN DASHBOARD MOCK
   Used by:
   - Hero section
   - About section laptop preview
========================================================= */

export default function AdminDashboardMock() {
  return (
    <div className="bg-[#f8fafc] text-[#0f1930]">
      {/* TOP BAR */}
      <div className="flex h-12 items-center border-b border-slate-200 bg-white px-3 sm:h-14 sm:px-4">
        <BrandLogo className="h-8 w-8 sm:h-9 sm:w-9" />

        <p className="ml-2 whitespace-nowrap text-[9px] font-extrabold sm:text-[11px]">
          School Clinic Management
        </p>

        <div className="ml-auto hidden h-7 w-[34%] items-center rounded-md border border-slate-200 bg-white px-2.5 text-[7px] text-slate-400 sm:flex">
          Search patients...

          <span className="ml-auto">
            ⌕
          </span>
        </div>

        <div className="ml-3 text-right leading-tight">
          <p className="text-[8px] font-bold sm:text-[9px]">
            Admin User
          </p>

          <p className="text-[6px] text-slate-400 sm:text-[7px]">
            admin@clinic.com
          </p>
        </div>

        <span className="ml-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[7px] text-slate-700 sm:text-[8px]">
          Logout
        </span>
      </div>

      {/* DASHBOARD */}
      <div className="grid min-h-[420px] grid-cols-[82px_1fr] sm:grid-cols-[120px_1fr]">
        {/* SIDEBAR */}
        <aside className="border-r border-slate-200 bg-white p-2 sm:p-3">
          <p className="px-2 py-2 text-[6px] font-medium uppercase tracking-[0.12em] text-slate-400 sm:text-[7px]">
            Navigation
          </p>

          <div className="mt-1 flex items-center gap-2 rounded-md bg-blue-600 px-2 py-2 text-[8px] font-medium text-white sm:text-[9px]">
            <DashboardIcon className="h-3.5 w-3.5" />

            Dashboard
          </div>

          <div className="mt-1 flex items-center gap-2 rounded-md px-2 py-2 text-[8px] font-medium text-slate-600 sm:text-[9px]">
            <AuditIcon className="h-3.5 w-3.5" />

            Audit Logs
          </div>

          <div className="mt-1 flex items-center gap-2 rounded-md px-2 py-2 text-[8px] font-medium text-slate-600 sm:text-[9px]">
            <SettingsIcon className="h-3.5 w-3.5" />

            Settings
          </div>

          <div className="mt-1 flex items-center gap-2 rounded-md px-2 py-2 text-[8px] font-medium text-slate-600 sm:text-[9px]">
            <ProfileIcon className="h-3.5 w-3.5" />

            Profile
          </div>
        </aside>

        {/* CONTENT */}
        <div className="min-w-0 p-3 sm:p-4 lg:p-5">
          <h3 className="text-sm font-semibold tracking-tight sm:text-base">
            Admin Dashboard
          </h3>

          {/* TOP STATS */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
            <AdminStat
              label="Total Patients"
              value="18"
              caption="18 students · 0 teachers · 0 staff"
              icon={<PatientsIcon />}
              tone="blue"
            />

            <AdminStat
              label="Active Users"
              value="15"
              caption="Available doctors, nurses, and staff"
              icon={<StaffIcon />}
              tone="violet"
            />
          </div>

          {/* TABS */}
          <div className="mt-3 flex overflow-hidden rounded-lg border border-slate-200 bg-white text-[7px] font-medium text-slate-600 sm:text-[8px]">
            <span className="border-b-2 border-blue-600 bg-blue-50/50 px-3 py-2.5 text-blue-600 sm:px-4">
              Management
            </span>

            <span className="px-3 py-2.5 sm:px-4">
              Purchase Requests
            </span>
          </div>

          {/* MANAGEMENT HEADER */}
          <div className="mt-4 flex items-end justify-between gap-2">
            <div>
              <p className="text-[6px] text-slate-400 sm:text-[7px]">
                Patients and clinic accounts
              </p>

              <p className="mt-1 text-[12px] font-semibold sm:text-[13px]">
                Management
              </p>
            </div>

            <span className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-[6px] font-medium text-white sm:text-[7px]">
              + Add User
            </span>
          </div>

          {/* MANAGEMENT CARDS */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <ManagementCard
              label="Patients"
              value="18"
              action="Manage Patients"
              icon={<PatientsIcon />}
            />

            <ManagementCard
              label="Doctors"
              value="6"
              action="Manage Doctors"
              icon={<AuditIcon />}
            />

            <ManagementCard
              label="Nurses and Staff"
              value="15"
              action="Manage Staff"
              icon={<StaffIcon />}
            />
          </div>

          {/* CLINIC TEAM */}
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {/* HEADER */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
              <div>
                <p className="text-[7px] font-medium sm:text-[8px]">
                  Clinic Team
                </p>

                <p className="mt-0.5 hidden text-[5px] text-slate-400 sm:block">
                  Manage account details, roles, passwords, and access status.
                </p>
              </div>

              <div className="hidden items-center gap-1 text-[5px] font-medium sm:flex">
                <span className="rounded-full bg-slate-900 px-2 py-1 text-white">
                  All
                </span>

                <span className="rounded-full border border-slate-200 px-2 py-1 text-slate-500">
                  Doctors
                </span>

                <span className="rounded-full border border-slate-200 px-2 py-1 text-slate-500">
                  Nurses & Staff
                </span>
              </div>
            </div>

            {/* SEARCH / FILTERS */}
            <div className="hidden grid-cols-[1fr_90px_90px] gap-2 border-b border-slate-100 px-3 py-2 sm:grid">
              <div className="rounded border border-slate-200 px-2 py-1.5 text-[5px] text-slate-400">
                Search name or email...
              </div>

              <div className="rounded border border-slate-200 px-2 py-1.5 text-[5px] text-slate-500">
                All roles
                <span className="float-right">⌄</span>
              </div>

              <div className="rounded border border-slate-200 px-2 py-1.5 text-[5px] text-slate-500">
                All statuses
                <span className="float-right">⌄</span>
              </div>
            </div>

            {/* TABLE HEADER */}
            <div className="hidden grid-cols-[1fr_.55fr_1.4fr_.7fr] bg-slate-50 px-3 py-1.5 text-[5px] font-semibold uppercase text-slate-400 sm:grid">
              <span>Name</span>
              <span>Role</span>
              <span>Email</span>
              <span>Access</span>
            </div>

            {/* TEST ROW */}
            <div className="hidden grid-cols-[1fr_.55fr_1.4fr_.7fr] items-center px-3 py-2 text-[5px] sm:grid">
              <span className="font-medium text-slate-700">
                Test User
              </span>

              <span className="text-blue-600">
                Doctor
              </span>

              <span className="truncate text-slate-500">
                test@clinic.com
              </span>

              <span className="text-emerald-600">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN STAT CARD
========================================================= */

type AdminStatTone =
  | "blue"
  | "emerald"
  | "violet"
  | "orange";

function AdminStat({
  label,
  value,
  caption,
  icon,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  icon: ReactNode;
  tone: AdminStatTone;
}) {
  const tones: Record<AdminStatTone, string> = {
    blue:
      "bg-blue-50 text-blue-600",

    emerald:
      "bg-emerald-50 text-emerald-600",

    violet:
      "bg-violet-50 text-violet-600",

    orange:
      "bg-orange-50 text-orange-600",
  };

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-2 shadow-[0_3px_10px_rgba(15,23,42,0.07)] sm:p-3">
      <div className="flex items-start justify-between gap-1">
        <p className="truncate text-[7px] font-semibold text-slate-700 sm:text-[8px]">
          {label}
        </p>

        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md [&>svg]:h-3.5 [&>svg]:w-3.5 ${tones[tone]}`}
        >
          {icon}
        </span>
      </div>

      <p className="mt-2 text-base font-semibold sm:text-lg">
        {value}
      </p>

      <p className="truncate text-[6px] text-slate-500 sm:text-[7px]">
        {caption}
      </p>
    </div>
  );
}

/* =========================================================
   MANAGEMENT CARD
========================================================= */

function ManagementCard({
  label,
  value,
  action,
  icon,
}: {
  label: string;
  value: string;
  action: string;
  icon: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
      <div className="flex items-center justify-between gap-1">
        <p className="truncate text-[6px] font-medium text-slate-700 sm:text-[7px]">
          {label}
        </p>

        <span className="shrink-0 text-slate-700 [&>svg]:h-3 [&>svg]:w-3 sm:[&>svg]:h-3.5 sm:[&>svg]:w-3.5">
          {icon}
        </span>
      </div>

      <p className="mt-3 text-base font-semibold sm:text-lg">
        {value}
      </p>

      <div className="mt-3 truncate rounded-md bg-slate-950 px-2 py-1.5 text-center text-[5px] font-medium text-white sm:text-[6px]">
        {action}
      </div>
    </div>
  );
}
