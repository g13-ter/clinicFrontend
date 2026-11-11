import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { SearchIcon } from "../components/icons";

const guides = [
  {
    title: "Confirm or decline an appointment",
    summary: "Review pending appointments assigned to you from the Care & visits workspace.",
    steps: [
      "In the sidebar, expand Care & visits if needed and select Appointments.",
      "Review the scheduled time, patient, and reason.",
      "For a pending appointment, select Confirm Appointment or Decline and provide a reason.",
      "After confirmation, the appointment may show that it is waiting for nurse check-in or triage. Start the consultation after the nurse marks the visit ready.",
    ],
    keywords: "appointment pending confirm decline schedule today appointment reason",
    link: "/appointments",
    linkLabel: "Open Appointments",
  },
  {
    title: "Start a consultation from Patient Visits",
    summary: "Physician consultations start after a nurse checks in and triages the patient.",
    steps: [
      "In the sidebar, open Care & visits > Patient Visits.",
      "Find a visit marked Ready for Doctor and select Start Consultation. If a visit is already in consultation, select Resume.",
      "Review the patient's identity, complaint, nurse-entered vital signs, and medical alerts before documenting care.",
      "Complete the diagnosis and treatment plan. Vitals are read-only for doctors because they are recorded during nurse triage.",
      "For a student, choose the disposition after the assessment: may return to class, advised to go home, or guardian pickup needed. Add optional certificate remarks if needed.",
      "If prescribing, select an available medicine, enter quantity and instructions, and review the order details.",
      "Before generating a certificate, add your medical license and PTR numbers in My Profile. Then select Save Consultation, or Save & Generate Certificate.",
    ],
    keywords: "patient visits queue ready for doctor nurse triage start consultation resume diagnosis treatment vitals prescription certificate follow up",
    link: "/patient-queue",
    linkLabel: "Open Patient Visits",
  },
  {
    title: "Find and review a patient record",
    summary: "Search clinical records for a patient you are authorized to care for.",
    steps: [
      "In the sidebar, open Care & visits > Patients.",
      "Search by name, patient ID, type, department, or position.",
      "Check the patient's identity, then select View Record to review the available clinical history.",
      "Use patient information only for authorized care and clinic duties. Update the clinical profile when a correction is needed and appropriate.",
    ],
    keywords: "patient records search name id history allergies clinical profile medical alerts",
    link: "/patients",
    linkLabel: "Open Patient Records",
  },
  {
    title: "Record a consultation",
    summary: "Document the physician's assessment and care in the linked visit.",
    steps: [
      "Start from a Ready for Doctor visit so the consultation is connected to the correct patient and visit.",
      "Review allergies, chronic conditions, current medications, and the triage data entered by the nurse. You can update the triage priority from Patient Visits when your clinical assessment changes it.",
      "Enter the chief complaint, diagnosis, and treatment plan. For students, record the disposition after your assessment; optional remarks are printed on the certificate.",
      "If needed, add a medicine, quantity, and medication instructions. Available stock is shown in the selector.",
      "For follow-up care, enter the follow-up date and reason. Saving creates a follow-up appointment.",
      "Add your medical license and PTR numbers in My Profile before generating a certificate. Save the consultation or choose Save & Generate Certificate to download it.",
    ],
    keywords: "consultation medical history complaint diagnosis treatment medication order save physician note create follow up certificate",
    link: "/patient-queue",
    linkLabel: "Open Patient Visits",
  },
  {
    title: "Review follow-ups",
    summary: "See upcoming follow-up appointments and start the next consultation when the patient is ready.",
    steps: [
      "In the sidebar, open Care & visits > Clinical Care > Follow-Ups.",
      "Review the appointment date, patient, reason, and monitoring instructions.",
      "Use Start Consultation when the linked visit is ready. If the nurse has not completed triage, wait until the visit is marked Ready for Doctor.",
    ],
    keywords: "follow up followups appointment monitoring start consultation ready for doctor",
    link: "/clinical-workspace?tab=followups",
    linkLabel: "Open Follow-Ups",
  },
  {
    title: "Open reports and analytics",
    summary: "Use the doctor workspace reports and analytics for authorized clinic review.",
    steps: [
      "In the sidebar, open Insights > Reports or select Analytics.",
      "Select the reporting period and filters relevant to your review, then generate or download the available report.",
      "Handle downloaded reports as confidential clinic information and follow school data-handling procedures.",
    ],
    keywords: "reports analytics trends export download date range filter clinic data",
    link: "/analytics",
    linkLabel: "Open Analytics",
  },
  {
    title: "Review notifications",
    summary: "Check system alerts and mark notifications as read when reviewed.",
    steps: [
      "Select the notification bell in the top bar beside your account menu. Its unread badge shows how many notifications need review.",
      "Review the message and open its linked page when action is needed.",
      "Select the read control for one notification or mark all as read after reviewing the list.",
    ],
    keywords: "notifications alerts unread read mark all dashboard",
    link: "/dashboard?tab=notifications",
    linkLabel: "Open Notifications",
  },
];

function DoctorDocumentationPage() {
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
          <p className="text-sm font-medium text-blue-700">Doctor handoff guide</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Documentation</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Use this guide to manage appointments, review patient records, document consultations, and follow up on care.
            Use Care & visits for clinical work, Insights for reports and analytics, and the notification bell in the top bar to open your inbox.
            Search for a task and follow its steps; urgent emergencies remain in the separate banner.
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="doctor-guide-search-title">
          <h2 id="doctor-guide-search-title" className="font-semibold text-gray-900">Search this guide</h2>
          <label htmlFor="doctor-documentation-search" className="sr-only">Search Doctor instructions</label>
          <div className="relative mt-3">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="doctor-documentation-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search appointments, consultations, records, follow-ups..."
              className="input w-full pl-9"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500" aria-live="polite">
            {query ? `${matchingGuides.length} ${matchingGuides.length === 1 ? "guide" : "guides"} found` : "Search the guide titles, summaries, and steps."}
          </p>
        </section>

        {!query && (
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-5" aria-labelledby="doctor-workflow-title">
            <h2 id="doctor-workflow-title" className="font-semibold text-blue-950">Doctor workflow</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-blue-950">
              <li>Review and confirm today's appointments.</li>
              <li>Wait for nurse check-in and triage; begin when the visit is marked Ready for Doctor.</li>
              <li>Review the patient's medical alerts and nurse-entered vitals.</li>
              <li>Document the consultation, treatment, and any prescription or follow-up.</li>
              <li>Use reports, analytics, and notifications for the clinic work assigned to you.</li>
            </ol>
          </section>
        )}

        {matchingGuides.length > 0 ? (
          <section aria-labelledby="doctor-step-guides-title">
            <div className="mb-3">
              <h2 id="doctor-step-guides-title" className="text-lg font-semibold text-gray-900">Step-by-step instructions</h2>
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
            <p className="mt-1 text-sm text-gray-500">Try a term such as appointment, visit, diagnosis, prescription, or follow-up.</p>
          </section>
        )}
      </div>
    </Layout>
  );
}

export default DoctorDocumentationPage;
