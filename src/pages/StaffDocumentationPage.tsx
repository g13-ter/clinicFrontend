import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { SearchIcon } from "../components/icons";

const guides = [
  {
    title: "Register a student or patient",
    summary: "Create a directory record before booking an appointment or checking in a visit.",
    steps: [
      "In the sidebar, expand Care & visits if needed and select Patients.",
      "Select Register Patient and choose the correct patient type: Student, Teacher, or Staff.",
      "Enter the required identity, school or work, contact, and emergency-contact information. For students, confirm the education level and grade or year level.",
      "Add an email address when available so the system can send appointment notifications.",
      "Review the identifiers and spelling, then select Register Patient. Search for the person afterward to confirm the record is present.",
    ],
    keywords: "register create student patient teacher staff identity school grade year level contact email directory",
    link: "/patients",
    linkLabel: "Open Patients",
  },
  {
    title: "Find or update basic patient information",
    summary: "Use the patient directory to find a record or correct demographic and school information.",
    steps: [
      "In the sidebar, open Care & visits > Patients.",
      "Filter by patient type or active status, then search by name, ID, department, or position.",
      "Check the patient's identifier before selecting the record.",
      "Select Edit to update information within your Staff role, then save the changes.",
      "Refer clinical history or medical-alert corrections to a Nurse or Doctor for review.",
    ],
    keywords: "search patient edit update demographics name ID school information department position active former record",
    link: "/patients",
    linkLabel: "Open Patients",
  },
  {
    title: "Check in a walk-in visit",
    summary: "Register the visit so the Nurse can triage the patient and route care to the Doctor when ready.",
    steps: [
      "In the sidebar, open Care & visits > Patient Visits.",
      "Select Register Visit, search by patient name or ID, and choose the correct person.",
      "Enter the chief complaint. If the patient needs attention, select Request nurse attention and describe your concern.",
      "Submit the visit. The Nurse and Doctor will be notified, and the visit will appear in the clinic queue.",
      "A Nurse or Doctor sets the final triage priority. For emergencies, alert the clinical team immediately and follow the school's emergency procedures.",
    ],
    keywords: "walk in check in visit register visit queue chief complaint emergency nurse triage patient ID",
    link: "/patient-queue",
    linkLabel: "Open Patient Visits",
  },
  {
    title: "Submit an appointment request",
    summary: "Send the requested patient, date, time, and reason to the clinic for Nurse assignment.",
    steps: [
      "In the sidebar, open Care & visits > Appointments.",
      "Under Request New Appointment, choose the patient and enter the requested date, time, and reason for the visit.",
      "Select Submit Appointment Request. Staff requests are sent without a doctor assignment.",
      "Check the appointment status. A Nurse assigns an available Doctor, then the Doctor confirms or declines the appointment.",
      "If a change is needed before check-in, use Reschedule or Cancel on the appointment and notify the patient according to clinic procedures.",
    ],
    keywords: "appointment request schedule submit patient date time reason nurse assign doctor pending confirm decline reschedule cancel",
    link: "/appointments",
    linkLabel: "Open Appointments",
  },
  {
    title: "Prepare for an appointment check-in",
    summary: "Confirm the patient and appointment status before checking the patient into the visit queue.",
    steps: [
      "In the sidebar, open Care & visits > Appointments. Search by patient or review the appointment date.",
      "Confirm the patient identity and check that the appointment is confirmed and scheduled for today.",
      "Select Check In when it is available. The visit then appears in Patient Visits for Nurse triage.",
      "If the appointment is pending or assigned to the wrong Doctor, contact the Nurse to resolve it before check-in.",
    ],
    keywords: "appointment check in confirmed today patient identity nurse triage pending doctor",
    link: "/appointments",
    linkLabel: "Open Appointments",
  },
  {
    title: "Review patient information for front-desk work",
    summary: "Open the patient record to verify identity and the contact or school details needed for clinic coordination.",
    steps: [
      "Search for the patient in the Patients directory by name or ID.",
      "Open the record and verify the patient identifier and relevant contact information.",
      "Use patient information only for authorized registration, appointment, and check-in duties. Refer clinical questions to a Nurse or Doctor.",
    ],
    keywords: "patient record verify identity ID contact guardian school information privacy front desk",
    link: "/patients",
    linkLabel: "Open Patients",
  },
  {
    title: "Review staff alerts",
    summary: "Check current clinic alerts and open the linked page when action is needed.",
    steps: [
      "Select the notification bell in the top bar to open staff alerts.",
      "Review each alert and open its linked workflow when available.",
      "Contact the appropriate Nurse, Doctor, or Administrator when an alert requires their role's action.",
    ],
    keywords: "notifications alert dashboard clinic review action",
    link: "/dashboard?view=notifications",
    linkLabel: "Open Notifications",
  },
];

function StaffDocumentationPage({ embedded = false }: { embedded?: boolean }) {
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

  const content = (
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-sm font-medium text-blue-700">Staff handoff guide</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Documentation</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Use this guide for patient registration, basic directory updates, walk-in check-in, and appointment requests.
            Use Care & visits in the sidebar for daily work and Resources for Documentation. Expand or collapse groups as needed; the notification bell in the top bar opens staff alerts.
            Search for a task to find its steps and open the right workspace.
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="staff-guide-search-title">
          <h2 id="staff-guide-search-title" className="font-semibold text-gray-900">Search this guide</h2>
          <label htmlFor="staff-documentation-search" className="sr-only">Search Staff instructions</label>
          <div className="relative mt-3">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="staff-documentation-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search registration, check-in, appointments..."
              className="input w-full pl-9"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500" aria-live="polite">
            {query ? `${matchingGuides.length} ${matchingGuides.length === 1 ? "guide" : "guides"} found` : "Search the guide titles, summaries, and steps."}
          </p>
        </section>

        {!query && (
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-5" aria-labelledby="staff-workflow-title">
            <h2 id="staff-workflow-title" className="font-semibold text-blue-950">Staff workflow</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-blue-950">
              <li>Find or register the patient in the directory.</li>
              <li>Submit appointment requests and coordinate changes with the Nurse.</li>
              <li>Check in walk-in and scheduled patients into the visit queue.</li>
              <li>Hand triage, vital signs, medical assessments, and treatment questions to the clinical team.</li>
            </ol>
          </section>
        )}

        {matchingGuides.length > 0 ? (
          <section aria-labelledby="staff-step-guides-title">
            <div className="mb-3">
              <h2 id="staff-step-guides-title" className="text-lg font-semibold text-gray-900">Step-by-step instructions</h2>
              <p className="mt-1 text-sm text-gray-500">Select a link to open the relevant workspace.</p>
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
            <p className="mt-1 text-sm text-gray-500">Try a term such as patient, registration, walk-in, check-in, or appointment.</p>
          </section>
        )}
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
}

export default StaffDocumentationPage;
