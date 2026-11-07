import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { SearchIcon } from "../components/icons";

const roleGuides = [
  {
    name: "Super Admin",
    role: "superadmin",
    summary: "System-level account and access oversight.",
    responsibilities: [
      "Manage accounts for every role, including Admin and Super Admin accounts.",
      "Review the permission matrix, audit activity, and system settings.",
      "Use this role for trusted system administrators, not routine clinic care.",
    ],
    keywords: "super administrator privileged access security configuration",
  },
  {
    name: "Admin",
    role: "admin",
    summary: "School clinic operations and administrative oversight.",
    responsibilities: [
      "Manage clinic team accounts, schedules, and operational settings.",
      "Review purchase requests, audit logs, and administrative patient tasks.",
      "Admin accounts cannot manage Admin or Super Admin accounts.",
    ],
    keywords: "administrator school operations staff schedule purchase archive",
  },
  {
    name: "Doctor",
    role: "doctor",
    summary: "Clinical consultations and physician documentation.",
    responsibilities: [
      "Review assigned patient information and document consultations.",
      "Record diagnoses, treatment, prescriptions, certificates, and follow-ups.",
      "Use clinical reports and analytics available to the doctor role.",
    ],
    keywords: "physician medical history diagnosis treatment prescription certificate follow up reports analytics",
  },
  {
    name: "Nurse",
    role: "nurse",
    summary: "Clinic intake, triage, nursing care, and inventory.",
    responsibilities: [
      "Manage appointments and the visit queue; record triage and vital signs.",
      "Maintain clinical profiles and medicine inventory, and submit purchase requests.",
      "Use nurse reports, analytics, and clinic profile settings.",
    ],
    keywords: "triage vitals nursing appointment queue medicine inventory stock purchase request analytics clinic settings",
  },
  {
    name: "Staff",
    role: "staff",
    summary: "Student registration and front-desk clinic workflows.",
    responsibilities: [
      "Register students and maintain basic student directory information.",
      "Book appointments and check students in for walk-in visits.",
      "Use staff workflows for intake; clinical assessment belongs to clinical roles.",
    ],
    keywords: "front desk registrar student registration appointment walk in check in intake",
  },
];

const taskGuides = [
  {
    title: "Choose and assign a role",
    summary: "Use the person's day-to-day duties to choose the least-access role that supports their work.",
    steps: [
      "Open Roles & Permissions and review the live permission matrix. It lists capabilities enforced by the backend.",
      "Match the person's duties to the role guide above. Ask the clinic owner if the duties do not clearly fit one role.",
      "Open User Management. Choose All Users, Administrators, Doctors, or Nurses & Staff.",
      "Select + Add in the matching view, or choose Edit Account for an existing user. Set the role in the Role field.",
      "Check the name, email, and selected role, then select Save User. Confirm your current password when prompted.",
      "For a new account, give its initial password to the user through an approved private channel. They must change it at first sign-in.",
      "Find the account again in User Management and confirm the displayed role. The user can then sign in and use the pages available to that role.",
    ],
    keywords: "assign change choose add create account access least privilege role permissions user management password onboarding",
    link: "/users",
    linkLabel: "Open User Management",
  },
  {
    title: "Change someone's role or account details",
    summary: "Update an account when the person's clinic duties change.",
    steps: [
      "Open User Management and select the correct account group.",
      "Search by the person's name or email. Check the account carefully before editing it.",
      "Select Edit Account, update the role or details, and select Save User.",
      "Confirm your current password when prompted. A role or access change signs the account out so the user must sign in again.",
      "Tell the user which role they now have and ask them to confirm they can reach the pages needed for their duties.",
    ],
    keywords: "edit update change role email name account transfer duties job access search",
    link: "/users",
    linkLabel: "Open User Management",
  },
  {
    title: "Reset a password",
    summary: "Issue a temporary password when a user cannot access their account.",
    steps: [
      "In User Management, search for the correct person by name or email.",
      "Select Reset Password and enter a temporary password with at least 12 characters.",
      "Confirm your current password when prompted, then submit the reset.",
      "Give the temporary password to the user through an approved private channel. They must create a new password at their next sign-in.",
    ],
    keywords: "forgot password reset temporary locked out change password 12 characters",
    link: "/users",
    linkLabel: "Open User Management",
  },
  {
    title: "Deactivate or reactivate an account",
    summary: "Remove access when it is no longer needed, or restore an existing account when appropriate.",
    steps: [
      "Find the account in User Management and check its name, email, role, and current status.",
      "Select Deactivate to remove sign-in access. Confirm the action and your current password.",
      "The account cannot sign in after deactivation. Its historical clinic records and audit history are retained.",
      "To restore access, select Activate and confirm your current password when prompted.",
      "You cannot deactivate your own account. The system also prevents removing the final active Super Admin role.",
    ],
    keywords: "deactivate disable revoke remove access activate reactivate restore account inactive offboard",
    link: "/users",
    linkLabel: "Open User Management",
  },
  {
    title: "Review roles and audit activity",
    summary: "Use the permission matrix to understand access and the audit log to investigate recorded activity.",
    steps: [
      "Open Roles & Permissions to see the capabilities currently enforced for each role.",
      "Open Audit Logs and search by actor, email, target, or ID; you can also filter by resource.",
      "Open an audit event to inspect its details. Follow your school's incident and reporting procedures if anything looks unexpected.",
    ],
    keywords: "audit security investigate logs review permissions matrix actor email target resource",
    link: "/audit-log",
    linkLabel: "Open Audit Logs",
  },
  {
    title: "Update system settings",
    summary: "Review the school year and control automated reminder and low-stock email alerts.",
    steps: [
      "Open Settings and review the displayed system configuration.",
      "Under System-wide Notifications, enable both Email Notifications and Appointment Reminders to queue upcoming appointment reminders.",
      "Use Low-stock Email Alerts to control new alerts sent to active Admin accounts when a medicine changes to Low Stock, Out of Stock, or Expired. Alerts already queued may still be delivered after turning this off.",
      "Change the active school year only after confirming it with the school. The rollover action promotes eligible students and marks final-level students for Admin completion review.",
      "Select Save Settings and confirm the updated values on the page.",
      "Record or communicate the change according to your school's administration process.",
    ],
    keywords: "system settings clinic configuration update save schedule school year notification appointment reminder email low stock",
    link: "/settings",
    linkLabel: "Open Settings",
  },
];

function SuperAdminDocumentationPage() {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();

  const matchingRoles = useMemo(
    () => roleGuides.filter((guide) =>
      [guide.name, guide.summary, ...guide.responsibilities, guide.keywords]
        .join(" ")
        .toLowerCase()
        .includes(query),
    ),
    [query],
  );
  const matchingTasks = useMemo(
    () => taskGuides.filter((guide) =>
      [guide.title, guide.summary, ...guide.steps, guide.keywords]
        .join(" ")
        .toLowerCase()
        .includes(query),
    ),
    [query],
  );
  const resultCount = matchingRoles.length + matchingTasks.length;

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-sm font-medium text-blue-700">Super Admin handoff guide</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Documentation</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Use this guide to learn the roles, manage accounts, and handle common system administration tasks.
            Search for a role or task, then follow its steps. The role matrix in the app reflects permissions
            enforced by the backend.
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="guide-search-title">
          <h2 id="guide-search-title" className="font-semibold text-gray-900">Search this guide</h2>
          <label htmlFor="documentation-search" className="sr-only">Search roles and instructions</label>
          <div className="mt-3 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="documentation-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search roles, passwords, permissions, audit logs..."
                className="input w-full pl-9"
              />
            </div>
            {search && (
              <button type="button" onClick={() => setSearch("")} className="rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Clear
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500" aria-live="polite">
            {query ? `${resultCount} ${resultCount === 1 ? "result" : "results"} found` : "Search matches role descriptions and step-by-step instructions."}
          </p>
        </section>

        {!query && (
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-5" aria-labelledby="handoff-title">
            <h2 id="handoff-title" className="font-semibold text-blue-950">Starting with a transferred system</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-blue-950">
              <li>Sign in with your own Super Admin account. If you received a temporary password, change it when prompted.</li>
              <li>Review Roles & Permissions so you know which work each role can do.</li>
              <li>Check the existing accounts and settings with the clinic owner before making changes.</li>
              <li>Create individual accounts for the clinic team, assign each the role that fits their duties, and share initial passwords privately.</li>
              <li>Show staff this guide and the instructions for their role. Ask each person to change their temporary password at first sign-in.</li>
              <li>Use Audit Logs to review administrative changes. Coordinate hosting, backups, and technical maintenance with the responsible technical administrator.</li>
            </ol>
          </section>
        )}

        {matchingRoles.length > 0 && (
          <section aria-labelledby="role-guide-title">
            <div className="mb-3">
              <h2 id="role-guide-title" className="text-lg font-semibold text-gray-900">What each role is for</h2>
              <p className="mt-1 text-sm text-gray-500">Assign roles according to actual job duties and the permission matrix.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {matchingRoles.map((guide) => (
                <article key={guide.role} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900">{guide.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{guide.summary}</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-5 text-gray-600">
                    {guide.responsibilities.map((responsibility) => <li key={responsibility}>{responsibility}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {matchingTasks.length > 0 && (
          <section aria-labelledby="step-guides-title">
            <div className="mb-3">
              <h2 id="step-guides-title" className="text-lg font-semibold text-gray-900">Step-by-step instructions</h2>
              <p className="mt-1 text-sm text-gray-500">Follow these guides for common account and administration tasks.</p>
            </div>
            <div className="space-y-4">
              {matchingTasks.map((guide) => (
                <article key={guide.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900">{guide.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">{guide.summary}</p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-gray-700">
                    {guide.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                  <Link to={guide.link} className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900">
                    {guide.linkLabel}<span aria-hidden="true" className="ml-1">→</span>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {resultCount === 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-gray-900">No matching guide found</h2>
            <p className="mt-1 text-sm text-gray-500">Try a role name or a term such as account, password, permissions, audit, or settings.</p>
          </section>
        )}

        {!query && (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="security-practices-title">
            <h2 id="security-practices-title" className="font-semibold text-amber-950">Security practices</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-950">
              <li>Use an individual account and keep its sign-in details private.</li>
              <li>Grant each person only the role needed for their assigned duties.</li>
              <li>Review account access when staff responsibilities change, and deactivate access that is no longer needed.</li>
              <li>Use audit logs to review administrative activity, and follow school procedures when you find something unexpected.</li>
              <li>Do not use administrative access to view student health records unless your duties and school policy authorize it.</li>
            </ul>
          </section>
        )}

        {!query && (
          <p className="text-xs leading-5 text-gray-500">
            This in-app guide explains common system tasks. For deployment, backups, and technical maintenance, follow your
            school's approved operations documentation and coordinate with the responsible technical administrator.
          </p>
        )}
      </div>
    </Layout>
  );
}

export default SuperAdminDocumentationPage;
