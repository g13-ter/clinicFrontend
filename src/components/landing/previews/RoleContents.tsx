import {
  AuditIcon,
  PatientsIcon,
  StaffIcon,
} from "../../icons";

import PreviewTable from "./PreviewTable";

/* =========================================================
   ADMIN CONTENT
========================================================= */

export function RoleAdminContent() {
  return (
    <div className="mt-4">
      {/* MANAGEMENT HEADER */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[7px] text-slate-400">
            Patients and clinic accounts
          </p>

          <p className="mt-1 text-[13px] font-semibold">
            Management
          </p>
        </div>

        <span className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-[7px] font-medium text-white">
          + Add User
        </span>
      </div>

      {/* MANAGEMENT CARDS */}
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
        <AdminManagementCard
          label="Patients"
          value="18"
          action="Manage Patients"
          icon={<PatientsIcon />}
        />

        <AdminManagementCard
          label="Doctors"
          value="6"
          action="Manage Doctors"
          icon={<AuditIcon />}
        />

        <AdminManagementCard
          label="Nurses and Staff"
          value="15"
          action="Manage Staff"
          icon={<StaffIcon />}
        />
      </div>

      {/* CLINIC TEAM */}
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
          <div>
            <p className="text-[8px] font-medium">
              Clinic Team
            </p>

            <p className="mt-0.5 text-[6px] text-slate-400">
              Manage account details, roles, passwords, and access status.
            </p>
          </div>

          <div className="flex items-center gap-1 text-[6px] font-medium">
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

        {/* SEARCH + FILTERS */}
        <div className="grid grid-cols-[1fr_120px_110px] gap-2 border-b border-slate-100 p-2.5">
          <div className="rounded border border-slate-300 px-2.5 py-2 text-[6px] text-slate-400">
            Search name or email...
          </div>

          <div className="rounded border border-slate-300 px-2.5 py-2 text-[6px] text-slate-600">
            All roles
            <span className="float-right">
              ⌄
            </span>
          </div>

          <div className="rounded border border-slate-300 px-2.5 py-2 text-[6px] text-slate-600">
            All statuses
            <span className="float-right">
              ⌄
            </span>
          </div>
        </div>

        {/* TABLE HEADER */}
        <div className="hidden grid-cols-[1.1fr_.65fr_2.1fr_.8fr_.8fr_1.7fr] bg-slate-50 px-3 py-2 text-[6px] font-semibold text-slate-500 sm:grid">
          <span>Name</span>
          <span>Role</span>
          <span>Email</span>
          <span>Access</span>
          <span>Availability</span>
          <span>Actions</span>
        </div>

        {/* SAMPLE ROW */}
        <div className="hidden grid-cols-[1.1fr_.65fr_2.1fr_.8fr_.8fr_1.7fr] items-center border-t border-slate-100 px-3 py-2 text-[6px] sm:grid">
          <span className="font-medium text-slate-700">
            Test User
          </span>

          <span>
            <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-600">
              Doctor
            </span>
          </span>

          <span className="truncate text-slate-500">
            testuser@clinic.com
          </span>

          <span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 font-medium text-emerald-600">
              Active
            </span>
          </span>

          <span>
            <span className="rounded-full bg-slate-950 px-2 py-1 font-medium text-white">
              Available
            </span>
          </span>

          <span className="truncate font-medium text-blue-600">
            Edit Account
            &nbsp; Reset Password
            &nbsp;
            <span className="text-red-500">
              Deactivate
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DOCTOR CONTENT
========================================================= */

export function RoleDoctorContent() {
  return (
    <>
      {/* TODAY'S APPOINTMENTS */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <p className="text-[10px] font-medium">
            Today's Appointments
          </p>

          <p className="mt-1 text-[7px] text-slate-400">
            Confirm pending appointments, then start the consultation when the
            patient is ready.
          </p>
        </div>

        <p className="py-8 text-center text-[7px] text-slate-400">
          No appointments scheduled for today.
        </p>
      </div>

      {/* RECENT CONSULTATIONS */}
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 text-[9px] font-medium">
          Recent Consultations
        </div>

        <PreviewTable
          headers={[
            "Date",
            "Patient",
            "Complaint",
            "Diagnosis",
            "Treatment",
            "Attending Clinician",
          ]}
          rows={[
            [
              "2026-08-14",
              "Test 1 · Student",
              "test",
              "Not recorded",
              "Not recorded",
              "Nurse",
            ],
          ]}
        />
      </div>
    </>
  );
}

/* =========================================================
   NURSE CONTENT
========================================================= */

export function RoleNurseContent() {
  return (
    <PatientVisitsCard
      waitingText="2 waiting for triage · 1 ready for doctor"
      rows={[
        [
          "Test 1 · Student",
          "02:28 p.m.",
          "test",
          "39°C · BP: 120/80 · PR: 60",
          "Ready for Doctor",
        ],
        [
          "Test 2 · Student",
          "02:38 p.m.",
          "—",
          "Vitals not yet recorded",
          "Waiting for Triage",
        ],
      ]}
    />
  );
}

/* =========================================================
   STAFF CONTENT
========================================================= */

export function RoleStaffContent() {
  return (
    <PatientVisitsCard
      waitingText="3 waiting for triage · 1 ready for doctor"
      rows={[
        [
          "Test 1 · Student",
          "02:28 p.m.",
          "—",
          "Vitals not yet recorded",
          "Waiting for Nurse Triage",
        ],
        [
          "Test 2 · Student",
          "02:38 p.m.",
          "—",
          "Vitals not yet recorded",
          "Waiting for Nurse Triage",
        ],
        [
          "Test 3 · Student",
          "02:58 p.m.",
          "—",
          "Vitals not yet recorded",
          "Waiting for Nurse Triage",
        ],
      ]}
    />
  );
}

/* =========================================================
   REUSABLE PATIENT VISITS CARD
========================================================= */

function PatientVisitsCard({
  waitingText,
  rows,
}: {
  waitingText: string;
  rows: string[][];
}) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold">
            Patient Visits
          </p>

          <p className="mt-1 text-[7px] text-slate-400">
            Check in, triage, and move patients through the clinic.
          </p>

          <p className="mt-2 text-[7px] text-slate-500">
            {waitingText}
          </p>
        </div>

        <span className="shrink-0 rounded-md bg-blue-600 px-3 py-2 text-[7px] font-medium text-white">
          + Register Visit
        </span>
      </div>

      {/* FILTER + SEARCH */}
      <div className="mt-3 flex gap-2">
        <span className="w-[126px] shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-[7px] text-slate-600">
          All Patients

          <span className="float-right">
            ⌄
          </span>
        </span>

        <div className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-[7px] text-slate-400">
          Search patient name, ID, type, complaint, treatment, or status...
        </div>
      </div>

      {/* VISITS TABLE */}
      <PreviewTable
        headers={[
          "Patient",
          "Arrived",
          "Complaint",
          "Vitals",
          "Status",
        ]}
        rows={rows}
      />
    </div>
  );
}

/* =========================================================
   ADMIN MANAGEMENT CARD
========================================================= */

function AdminManagementCard({
  label,
  value,
  action,
  icon,
}: {
  label: string;
  value: string;
  action: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[8px] font-medium">
          {label}
        </p>

        <span className="text-slate-700 [&>svg]:h-3.5 [&>svg]:w-3.5">
          {icon}
        </span>
      </div>

      <p className="mt-4 text-xl font-semibold">
        {value}
      </p>

      <p className="mt-4 rounded-md bg-slate-950 px-2 py-2 text-center text-[7px] font-medium text-white">
        {action}
      </p>
    </div>
  );
}