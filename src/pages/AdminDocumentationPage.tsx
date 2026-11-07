import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { SearchIcon } from "../components/icons";

const guides = [
  {
    title: "Manage clinic staff accounts",
    summary: "Create and maintain doctor, nurse, and staff accounts for clinic operations.",
    steps: [
      "Open Dashboard and choose the Management section.",
      "Choose Manage Doctors or Manage Staff, then select + Add. For an existing person, use Edit Account.",
      "Enter the person's name, email, and role. Admins can manage Doctor, Nurse, and Staff accounts; only a Super Admin can manage Admin or Super Admin accounts.",
      "Confirm your current password when prompted, then save. New accounts must change their initial password at first sign-in.",
      "Share initial passwords privately. Use Reset Password, Activate, or Deactivate from the account's Actions when needed.",
    ],
    keywords: "users accounts doctors nurses staff add create edit role password activate deactivate management",
    link: "/dashboard?section=management",
    linkLabel: "Open Management",
  },
  {
    title: "Review student completion",
    summary: "Record the confirmed outcome for students marked For Completion Review after school-year rollover.",
    steps: [
      "Open Dashboard, choose Management, then select View / Archive Patients in the Patient Directory card.",
      "Search for the student and check the identifier and school information before taking action.",
      "For a student marked For Completion Review, select Review Completion.",
      "Choose Graduated, Retained at current level, Extended / Continuing, or Transferred. Add a note when useful, then select Confirm Decision.",
      "Graduated and Transferred students leave active searches. Retained and Extended / Continuing students remain active.",
    ],
    keywords: "student completion graduate retained extended continuing transferred school year review",
    link: "/dashboard?section=management",
    linkLabel: "Open Patient Directory",
  },
  {
    title: "Search or archive a patient entry",
    summary: "Admins can search basic directory information and archive eligible duplicate or inactive entries. Clinical records remain private.",
    steps: [
      "Open Dashboard → Management → Patient Directory.",
      "Filter by patient type and active status, then search by name, ID, department, or position.",
      "Check the identifier and affiliation to confirm you selected the correct entry.",
      "Select Archive only for an eligible duplicate or inactive entry and confirm the action. Archived entries no longer appear in active patient searches.",
    ],
    keywords: "patient directory search archive duplicate inactive student teacher staff basic clinical record privacy",
    link: "/dashboard?section=management",
    linkLabel: "Open Patient Directory",
  },
  {
    title: "Review a purchase request",
    summary: "Approve or reject requests submitted by clinic staff, then track ordering with the nurse who receives deliveries.",
    steps: [
      "Open Dashboard and choose Purchase Requests.",
      "Select Pending and review the requested item, quantity, reason, and requester.",
      "Select Review. Add optional review notes, then choose Approve or Reject.",
      "For an approved request, select Mark Ordered after the purchase is placed. You can cancel a pending, approved, or ordered request when needed.",
      "Coordinate delivery with the nurse. The nurse records Receive Delivery, which creates the inventory batch and updates available stock.",
    ],
    keywords: "purchase request pending approve reject order ordered receive delivery nurse inventory restock cancel",
    link: "/dashboard?section=purchase-requests",
    linkLabel: "Open Purchase Requests",
  },
  {
    title: "Update school and notification settings",
    summary: "Keep the active school year current and manage the scheduled reminders and low-stock email alerts.",
    steps: [
      "Open Settings and stay on System Settings.",
      "Confirm the Active School Year with the school before changing it. Run School-Year Rollover only when the school is ready; eligible students are promoted and final-level students are sent for completion review.",
      "Both Email Notifications and Appointment Reminders must be on for scheduled appointment reminder emails.",
      "Low-stock email alerts go to active Admin accounts when a medicine changes to Low Stock, Out of Stock, or Expired. Turning them off prevents new alert emails; already queued alerts may still be delivered.",
      "Select Save Settings and check the confirmation message. Settings changes are recorded in the audit log.",
    ],
    keywords: "settings school year rollover email notification appointment reminders stock low alerts save",
    link: "/settings",
    linkLabel: "Open Settings",
  },
  {
    title: "Review audit logs",
    summary: "Use the audit history to review administrative and security activity.",
    steps: [
      "Open Audit Logs from the navigation.",
      "Search by actor, email, target, or ID. Use the resource filter to narrow the results.",
      "Open an event to inspect its details. Follow your school's security and reporting process if something looks unexpected.",
    ],
    keywords: "audit log history security actor email target id resource investigate",
    link: "/audit-log",
    linkLabel: "Open Audit Logs",
  },
  {
    title: "Update your profile and password",
    summary: "Manage your own account details from Settings.",
    steps: [
      "Open Settings and choose My Profile & Security.",
      "Update your name or email, then enter your current password to save.",
      "To change your password, enter a new password of at least 12 characters. Saving a password change signs out your active sessions, so sign in again afterward.",
    ],
    keywords: "profile security own name email password change sessions settings",
    link: "/settings?tab=profile",
    linkLabel: "Open My Profile & Security",
  },
];

function AdminDocumentationPage() {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const matchingGuides = useMemo(
    () => guides.filter((guide) =>
      [guide.title, guide.summary, ...guide.steps, guide.keywords]
        .join(" ")
        .toLowerCase()
        .includes(query),
    ),
    [query],
  );

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-sm font-medium text-blue-700">Admin handoff guide</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Documentation</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Follow these instructions for clinic account management, student completion review, purchase approvals,
            and system settings. Admin access supports school-clinic operations; clinical notes and decisions remain
            with authorized clinical staff.
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="admin-guide-search-title">
          <h2 id="admin-guide-search-title" className="font-semibold text-gray-900">Search this guide</h2>
          <label htmlFor="admin-documentation-search" className="sr-only">Search Admin instructions</label>
          <div className="relative mt-3">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="admin-documentation-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search accounts, completion, purchases, settings..."
              className="input w-full pl-9"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500" aria-live="polite">
            {query ? `${matchingGuides.length} ${matchingGuides.length === 1 ? "guide" : "guides"} found` : "Search the guide titles, summaries, and steps."}
          </p>
        </section>

        {!query && (
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-5" aria-labelledby="admin-role-title">
            <h2 id="admin-role-title" className="font-semibold text-blue-950">Your Admin role</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-blue-950">
              <li>Manage Doctor, Nurse, and Staff accounts. A Super Admin manages Admin and Super Admin accounts.</li>
              <li>Search basic patient directory information, review student completion outcomes, and archive eligible entries.</li>
              <li>Review purchase requests and record when approved purchases are ordered. Nurses receive deliveries into inventory.</li>
              <li>Use system settings and audit logs for approved operational work. Clinical records remain restricted to care roles.</li>
            </ul>
          </section>
        )}

        {matchingGuides.length > 0 ? (
          <section aria-labelledby="admin-step-guides-title">
            <div className="mb-3">
              <h2 id="admin-step-guides-title" className="text-lg font-semibold text-gray-900">Step-by-step instructions</h2>
              <p className="mt-1 text-sm text-gray-500">Select a link to open the relevant part of the system.</p>
            </div>
            <div className="space-y-4">
              {matchingGuides.map((guide) => (
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
        ) : (
          <section className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-gray-900">No matching guide found</h2>
            <p className="mt-1 text-sm text-gray-500">Try a term such as account, completion, purchase, password, or audit.</p>
          </section>
        )}
      </div>
    </Layout>
  );
}

export default AdminDocumentationPage;
