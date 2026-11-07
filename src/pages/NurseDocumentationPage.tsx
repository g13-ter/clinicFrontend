import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { SearchIcon } from "../components/icons";

const guides = [
  {
    title: "Check in a patient and record triage",
    summary: "Use Patient Visits for walk-in intake, triage, and the handoff to the doctor.",
    steps: [
      "In the sidebar, expand Care & visits if needed and select Patient Visits. Search by patient name or ID to check whether a visit is already open.",
      "For a walk-in, select Register Visit and choose the patient. For an appointment, check in from Appointments or the appointment's available action.",
      "Find the visit in the queue and select Record Vitals or Edit Vitals. Record the complaint and triage information required by your clinic workflow.",
      "Record blood pressure, temperature, and pulse before sending the patient to the doctor. Ready for Doctor stays disabled until these core vitals are complete.",
      "Select Ready for Doctor after triage is complete. The doctor can then open the visit and begin the consultation.",
    ],
    keywords: "walk in register visit check in patient queue triage record edit vitals blood pressure temperature pulse ready for doctor",
    link: "/patient-queue",
    linkLabel: "Open Patient Visits",
  },
  {
    title: "Record a nursing assessment",
    summary: "Document nursing observations and care in the active clinic visit.",
    steps: [
      "In the sidebar, open Care & visits > Patient Visits and locate the active visit.",
      "Select Start Assessment. Confirm the patient and review any existing medical alerts.",
      "Enter the chief complaint, nursing assessment, interventions, and recommendations as applicable. Review or update triage information from the visit workflow.",
      "If recording a medication order as a covering nurse, complete the medication fields and required checks shown by the system.",
      "Save the assessment. Follow the clinic's handoff process for referral, home care, or continued observation.",
    ],
    keywords: "nursing assessment observations treatment interventions recommendations patient visit save medication covering nurse",
    link: "/patient-queue",
    linkLabel: "Open Patient Visits",
  },
  {
    title: "Schedule, assign, or check in an appointment",
    summary: "Coordinate appointment times and assign an available doctor.",
    steps: [
      "In the sidebar, open Care & visits > Appointments, then choose Schedule New Appointment.",
      "Select the patient, date, time, and reason. Choose an available doctor before submitting.",
      "Review the appointment status. Pending means it is waiting for doctor confirmation; the doctor may confirm or return it for reassignment.",
      "Use Assign Doctor or Reschedule when the appointment can be changed. Cancel when the appointment should no longer proceed.",
      "On the appointment date, check in the patient. Continue triage in Patient Visits so the doctor can start the consultation when the visit is ready.",
    ],
    keywords: "appointment schedule assign doctor reschedule cancel confirm check in pending",
    link: "/appointments",
    linkLabel: "Open Appointments",
  },
  {
    title: "Review and administer a medication request",
    summary: "Process an open doctor or covering-nurse order using the medication safety check.",
    steps: [
      "In the sidebar, open Care & visits > Medication Requests. Review the patient, medication, quantity, instructions, and safety alerts.",
      "Select Accept Request to take responsibility for handling the order.",
      "Select Review & Give Medication and complete all four checks: patient identity, medication and dose, allergies and conditions, and route and timing instructions.",
      "Select Confirm Medication Given only after all checks are complete. Add administration notes if needed.",
      "If the medication is not given, select Not Given / Needs Review, choose a reason, and enter a note. Record an adverse reaction from the recently administered list if one occurs.",
    ],
    keywords: "medication request order accept give administer safety check identity dose allergies route time not given refused reaction",
    link: "/dashboard?view=medications",
    linkLabel: "Open Medication Requests",
  },
  {
    title: "Manage medicine inventory",
    summary: "Check stock, record deliveries, and request restocking when supplies are low.",
    steps: [
      "In the sidebar, open Inventory & supplies > Inventory. Search by item name, section, category, or supplier.",
      "Use the Low Stock, Expiring Soon, and Expired filters to find items that need attention.",
      "For stock received outside a purchase request, select Receive Stock and record the batch details shown in the form.",
      "For an item that needs replenishment, select Request Restock or open Purchase Requests and submit a restock request.",
      "Update medicine details and reorder levels only when you have confirmed the correct inventory information.",
    ],
    keywords: "inventory medicine stock low expiry expired receive stock batch reorder threshold restock supplier",
    link: "/medicines",
    linkLabel: "Open Inventory",
  },
  {
    title: "Submit a purchase request and receive delivery",
    summary: "Request a new item or restock and record its delivery after Admin review.",
    steps: [
      "In the sidebar, open Inventory & supplies > Purchase Requests, then select Request Item.",
      "Choose Restock Existing or New Item. Enter the item, quantity, unit, and reason, then submit.",
      "Track the request status. Admin reviews pending requests and may approve or reject them; approved requests can be marked ordered.",
      "When an approved or ordered delivery arrives, select Receive Delivery and enter the received quantity, batch number, and expiry details as applicable.",
      "The system creates the inventory batch and updates available stock after the delivery is recorded.",
    ],
    keywords: "purchase request request item restock new item admin approve reject ordered receive delivery quantity batch expiry stock",
    link: "/purchase-requests",
    linkLabel: "Open Purchase Requests",
  },
  {
    title: "Search patient records and update a clinical profile",
    summary: "Review records for care and keep the patient's clinical profile current within your duties.",
    steps: [
      "In the sidebar, open Care & visits > Patients. You can also use Patient Records in the Clinical Care workspace.",
      "Search by name, ID, type, department, or position and confirm the patient's identity.",
      "Open the record to review the information needed for care, including relevant medical history and alerts.",
      "Use the clinical profile editor for an appropriate correction. Clinical decisions and treatment remain with qualified care professionals.",
    ],
    keywords: "patients records patient directory search medical history clinical profile allergies conditions current medication",
    link: "/patients",
    linkLabel: "Open Patients",
  },
  {
    title: "Update Nurse Settings",
    summary: "Choose your analytics filter and maintain the clinic's public schedule and contact details.",
    steps: [
      "In the sidebar, open Resources > Settings.",
      "Under Analytics Filters, choose the reporting period and date or custom date range, then select Save Analytics Filter.",
      "Under Clinic Information, update the clinic name, location, operating days, hours, phone, or email as approved.",
      "Select Save Clinic Information and check the confirmation message. Changes to clinic information are recorded in the audit log.",
    ],
    keywords: "nurse settings clinic hours schedule contact phone email analytics filter date report save clinic information",
    link: "/settings",
    linkLabel: "Open Nurse Settings",
  },
  {
    title: "Review reports, analytics, and clinic alerts",
    summary: "Use operational reports and alerts to identify items that need follow-up.",
    steps: [
      "In the sidebar, open Insights > Reports for available clinic and inventory reports, or select Analytics for clinic trends.",
      "Select the reporting period and filters you need, then generate or download the report.",
      "Select the notification bell in the top bar to open the inbox; its unread badge shows how many notifications need review. Review clinic alerts and open linked pages to investigate or take the next workflow step. Urgent emergencies appear separately in the emergency banner.",
      "Handle downloaded reports and patient information according to clinic privacy procedures.",
    ],
    keywords: "reports analytics trend clinic alerts notifications download report date range inventory",
    link: "/analytics",
    linkLabel: "Open Analytics",
  },
];

function NurseDocumentationPage({ embedded = false }: { embedded?: boolean }) {
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
          <p className="text-sm font-medium text-blue-700">Nurse handoff guide</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Documentation</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Use this guide for patient intake and triage, appointments, nursing assessments, medication requests,
            inventory, and clinic settings. Use the grouped sidebar to open workspaces; expand or collapse groups as needed.
            The notification bell in the top bar opens the inbox, while urgent emergencies remain in the separate banner.
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-labelledby="nurse-guide-search-title">
          <h2 id="nurse-guide-search-title" className="font-semibold text-gray-900">Search this guide</h2>
          <label htmlFor="nurse-documentation-search" className="sr-only">Search Nurse instructions</label>
          <div className="relative mt-3">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="nurse-documentation-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search triage, vitals, medications, inventory..."
              className="input w-full pl-9"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500" aria-live="polite">
            {query ? `${matchingGuides.length} ${matchingGuides.length === 1 ? "guide" : "guides"} found` : "Search the guide titles, summaries, and steps."}
          </p>
        </section>

        {!query && (
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-5" aria-labelledby="nurse-workflow-title">
            <h2 id="nurse-workflow-title" className="font-semibold text-blue-950">Nurse workflow</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-blue-950">
              <li>Check in the patient and find the active visit in Patient Visits.</li>
              <li>Record triage and core vital signs, then mark the visit Ready for Doctor when complete.</li>
              <li>Document nursing care and handle medication requests using the safety checks.</li>
              <li>Monitor inventory, request restocks, and record deliveries.</li>
              <li>Use clinic settings, reports, analytics, and alerts for the work assigned to you.</li>
            </ol>
          </section>
        )}

        {matchingGuides.length > 0 ? (
          <section aria-labelledby="nurse-step-guides-title">
            <div className="mb-3">
              <h2 id="nurse-step-guides-title" className="text-lg font-semibold text-gray-900">Step-by-step instructions</h2>
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
            <p className="mt-1 text-sm text-gray-500">Try a term such as triage, vitals, medication, inventory, or appointment.</p>
          </section>
        )}
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
}

export default NurseDocumentationPage;
