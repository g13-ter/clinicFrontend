import type { Patient, ClinicVisit, MedicalHistory } from "../../utils/types";
import { academicLevelLabel, educationLevelLabel, educationLevelOf, patientIdentifier, patientTypeLabel, patientTypeOf } from "../../utils/patient";

interface Props {
  patient: Patient;
  visits: ClinicVisit[];
  // null means hidden; an empty array means visible with no records.
  history: MedicalHistory[] | null;
}

// Print-only layout with printer-safe styling.
function PrintablePatientSummary({ patient, visits, history }: Props) {
  const generatedAt = new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  const latestVisit = visits[0];

  return (
    <div className="p-8 text-black">
      <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">School Clinic System</h1>
          <p className="text-sm">{patientTypeLabel(patient)} Clinic Summary</p>
        </div>
        <p className="text-xs text-right">Printed {generatedAt}</p>
      </div>

      <h2 className="text-lg font-bold mb-2">
        {patient.firstName} {patient.lastName}
      </h2>
      <div className="grid grid-cols-3 gap-3 text-sm mb-6">
        <SummaryField label={patientTypeOf(patient) === "student" ? "Student ID" : "Employee ID"} value={patientIdentifier(patient)} />
        <SummaryField label="Age" value={String(patient.age)} />
        <SummaryField label="Gender" value={patient.gender} />
        {patientTypeOf(patient) === "student" ? <>
          <SummaryField label="Education Level" value={educationLevelLabel(educationLevelOf(patient))} />
          {educationLevelOf(patient) === "college" && <SummaryField label="Course" value={patient.course || "Not recorded"} />}
          <SummaryField label={educationLevelOf(patient) === "college" ? "Year Level" : "Grade Level"} value={academicLevelLabel(patient)} />
          {educationLevelOf(patient) === "college" && <SummaryField label="Program Length" value={`${patient.programDurationYears ?? 4} years`} />}
        </> : <>
          <SummaryField label="Department" value={patient.department || "Not recorded"} />
          <SummaryField label="Position" value={patient.position || "Not recorded"} />
        </>}
        <SummaryField label="Contact" value={patient.contactNumber} />
        <SummaryField label="Address" value={patient.address} className="col-span-3" />
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-2">Clinical Profile and Medical Alerts</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <SummaryField label="Allergies" value={patient.medicalAlerts?.allergies?.join(", ") || "None recorded"} />
          <SummaryField label="Chronic Conditions" value={patient.medicalAlerts?.chronicConditions?.join(", ") || "None recorded"} />
          <SummaryField label="Current Medications" value={patient.medicalAlerts?.currentMedications?.join(", ") || "None recorded"} />
          <SummaryField label="Family History" value={patient.familyHistory || "None recorded"} />
          <SummaryField label="Past Medical History" value={patient.pastMedicalHistory || patient.healthConditions || "None recorded"} className="col-span-2" />
          <SummaryField
            label="Clinical Profile Verification"
            value={patient.clinicalProfileVerifiedAt
              ? `Verified ${new Date(patient.clinicalProfileVerifiedAt).toLocaleDateString()}`
              : "Awaiting doctor verification"}
            className="col-span-2"
          />
        </div>
      </div>

      {latestVisit && (
        <div className="mb-6">
          <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-2">
            Most Recent Vitals ({new Date(latestVisit.visitDate).toLocaleDateString()})
          </h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <SummaryField label="Blood Pressure" value={latestVisit.bloodPressure || "—"} />
            <SummaryField
              label="Temperature"
              value={latestVisit.temperature != null ? `${latestVisit.temperature}°C` : "—"}
            />
            <SummaryField label="Pulse Rate" value={latestVisit.pulseRate != null ? String(latestVisit.pulseRate) : "—"} />
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-2">Clinic Visits</h3>
        {visits.length === 0 ? (
          <p className="text-sm">No visits recorded.</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-1 pr-2">Date</th>
                <th className="py-1 pr-2">Complaint</th>
                <th className="py-1 pr-2">Treatment</th>
                <th className="py-1 pr-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v._id} className="border-b border-gray-300 align-top">
                  <td className="py-1 pr-2 whitespace-nowrap">{new Date(v.visitDate).toLocaleDateString()}</td>
                  <td className="py-1 pr-2">{v.complaint}</td>
                  <td className="py-1 pr-2">{v.treatment || "—"}</td>
                  <td className="py-1 pr-2">{v.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase border-b border-black pb-1 mb-2">Medical History</h3>
        {history === null ? (
          <p className="text-sm italic">Not included - requires doctor or nurse access.</p>
        ) : history.length === 0 ? (
          <p className="text-sm">No medical history recorded.</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-1 pr-2">Date</th>
                <th className="py-1 pr-2">Diagnosis</th>
                <th className="py-1 pr-2">Prescription</th>
                <th className="py-1 pr-2">Medication / Status</th>
                <th className="py-1 pr-2">Allergies</th>
                <th className="py-1 pr-2">Family History</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h._id} className="border-b border-gray-300 align-top">
                  <td className="py-1 pr-2 whitespace-nowrap">{new Date(h.dateRecorded).toLocaleDateString()}</td>
                  <td className="py-1 pr-2">{h.diagnosis || "—"}</td>
                  <td className="py-1 pr-2">{h.prescription || "—"}</td>
                  <td className="py-1 pr-2">
                    {h.prescribedItems && h.prescribedItems.length > 0
                      ? `${h.prescribedItems.map((item) => `${item.medicineName} × ${item.quantity} ${item.unit}`).join(", ")} (${h.medicationStatus || "pending"})`
                      : "—"}
                  </td>
                  <td className="py-1 pr-2">{h.allergies || "—"}</td>
                  <td className="py-1 pr-2">{h.familyHistory || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-8 border-t pt-2">
        Generated from School Clinic System for record-keeping purposes. Verify against the system for the
        most current information.
      </p>
    </div>
  );
}

function SummaryField({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

export default PrintablePatientSummary;
