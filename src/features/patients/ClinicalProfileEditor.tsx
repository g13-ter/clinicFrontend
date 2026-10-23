import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useToast } from "../../hooks/useToast";
import type { Patient } from "../../utils/types";

interface Props {
  patient: Patient;
  mode: "nurse" | "doctor";
  onSaved?: (patient: Patient) => void;
}

const listText = (items?: string[]) => items?.join(", ") ?? "";
const commaList = (value: string) =>
  value.split(",").map((item) => item.trim()).filter(Boolean);

function actorName(value: Patient["clinicalProfileVerifiedBy"]): string {
  return value && typeof value === "object" ? value.name : "Doctor";
}

function ClinicalProfileEditor({ patient, mode, onSaved }: Props) {
  const { showToast } = useToast();
  const [familyHistory, setFamilyHistory] = useState("");
  const [pastMedicalHistory, setPastMedicalHistory] = useState("");
  const [allergies, setAllergies] = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFamilyHistory(patient.familyHistory ?? "");
    setPastMedicalHistory(patient.pastMedicalHistory ?? patient.healthConditions ?? "");
    setAllergies(listText(patient.medicalAlerts?.allergies));
    setCurrentMedications(listText(patient.medicalAlerts?.currentMedications));
    setError("");
  }, [patient]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await api.put<Patient>(`/patients/${patient._id}/clinical-profile`, {
        familyHistory: familyHistory.trim(),
        pastMedicalHistory: pastMedicalHistory.trim(),
        allergies: commaList(allergies),
        currentMedications: commaList(currentMedications),
        chronicConditions: patient.medicalAlerts?.chronicConditions ?? [],
        notes: patient.medicalAlerts?.notes ?? "",
        verified: mode === "doctor",
      });
      showToast(response.message);
      onSaved?.(response.data);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save clinical profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 md:col-span-2 xl:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-sky-950">Clinical Profile</h4>
          <p className="mt-0.5 text-xs text-sky-800">
            {mode === "nurse"
              ? "Interview the student and keep this reusable history current."
              : "Review and correct the nurse-entered history before verification."}
          </p>
        </div>
        {patient.clinicalProfileVerifiedAt ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            Verified by {actorName(patient.clinicalProfileVerifiedBy)} · {new Date(patient.clinicalProfileVerifiedAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Awaiting doctor verification
          </span>
        )}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ProfileField label="Family History" hint="Diabetes, hypertension, heart disease, cancer, and affected relatives">
          <textarea rows={3} value={familyHistory} onChange={(event) => setFamilyHistory(event.target.value)} className="input" />
        </ProfileField>
        <ProfileField label="Past Medical History" hint="Previous illnesses, surgery, hospitalization, and significant conditions">
          <textarea rows={3} value={pastMedicalHistory} onChange={(event) => setPastMedicalHistory(event.target.value)} className="input" />
        </ProfileField>
        <ProfileField label="Allergies" hint="Comma-separated medicine, food, or environmental allergies">
          <textarea rows={2} value={allergies} onChange={(event) => setAllergies(event.target.value)} className="input" placeholder="Penicillin, peanuts" />
        </ProfileField>
        <ProfileField label="Current Medications" hint="Comma-separated prescription, OTC, or maintenance medicines">
          <textarea rows={2} value={currentMedications} onChange={(event) => setCurrentMedications(event.target.value)} className="input" />
        </ProfileField>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-sky-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-900 disabled:opacity-50"
        >
          {saving ? "Saving..." : mode === "doctor" ? "Save and Verify Profile" : "Save for Doctor Review"}
        </button>
      </div>
    </section>
  );
}

function ProfileField({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="block text-sm font-medium text-sky-950">{label}</span>
      <span className="mb-1 block text-xs text-sky-700">{hint}</span>
      {children}
    </label>
  );
}

export default ClinicalProfileEditor;
