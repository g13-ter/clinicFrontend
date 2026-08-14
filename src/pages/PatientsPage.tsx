import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import type { Patient } from "../utils/types";
import AdminSectionTabs from "../components/AdminSectionTabs";
import type { ReactNode } from "react";
import { patientAffiliation, patientIdentifier, patientTypeLabel, patientTypeOf, type PatientType } from "../utils/patient";

const emptyForm = {
  patientType: "student" as PatientType,
  studentId: "",
  employeeId: "",
  firstName: "",
  lastName: "",
  age: "",
  gender: "Male",
  course: "",
  yearLevel: "1",
  department: "",
  position: "",
  contactNumber: "",
  email: "",
  address: "",
  dateOfBirth: "",
  bloodType: "",
  guardianName: "",
  guardianContactNumber: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  healthConditions: "",
  allergies: "",
  chronicConditions: "",
  currentMedications: "",
  medicalAlertNotes: "",
};

function PageFrame({ embedded, children }: { embedded: boolean; children: ReactNode }) {
  return embedded ? <>{children}</> : <Layout>{children}</Layout>;
}

function calculateAge(dateOfBirth: string): string {
  if (!dateOfBirth) return "";
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  if (!year || !month || !day) return "";
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age >= 0 ? String(age) : "";
}

function PatientsPage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can, role } = useAuth();
  const { showToast } = useToast();
  const canEdit = can("editPatients");
  const canCheckIn = can("checkInPatients");
  // Staff receive the basic read-only patient view.
  const isBasicView = false;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [patientTypeFilter, setPatientTypeFilter] = useState(searchParams.get("patientType") ?? "all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(
    canEdit && searchParams.get("action") === "register",
  );
  const [editTarget, setEditTarget] = useState<Patient | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const limit = 10;
  const requestedSearch = searchParams.get("search") ?? "";
  const requestedPatientType = searchParams.get("patientType") ?? "all";

  const fetchPatients = async (p = page, q = search, type = patientTypeFilter) => {
    setLoading(true);
    setError("");
    try {
      if (isBasicView) {
        const params = new URLSearchParams();
        if (q) params.set("search", q);
        if (type !== "all") params.set("patientType", type);
        const res = await api.get<Patient[]>(`/patients/basic?${params}`);
        setPatients(res.data);
        setTotal(res.data.length);
        return;
      }

      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (q) params.set("search", q);
      if (type !== "all") params.set("patientType", type);
      const res = await api.get<Patient[]>(`/patients?${params}`);
      setPatients(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch(requestedSearch);
    setPatientTypeFilter(requestedPatientType);
    fetchPatients(page, requestedSearch, requestedPatientType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, requestedSearch, requestedPatientType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (search.trim()) next.set("search", search.trim());
    else next.delete("search");
    if (patientTypeFilter === "all") next.delete("patientType");
    else next.set("patientType", patientTypeFilter);
    if ((searchParams.get("search") ?? "") === search.trim()) {
      fetchPatients(1, search.trim());
    } else {
      setSearchParams(next);
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (p: Patient) => {
    setEditTarget(p);
    setForm({
      patientType: patientTypeOf(p),
      studentId: p.studentId,
      employeeId: p.employeeId ?? "",
      firstName: p.firstName,
      lastName: p.lastName,
      age: String(p.age),
      gender: p.gender,
      course: p.course,
      yearLevel: String(p.yearLevel),
      department: p.department ?? "",
      position: p.position ?? "",
      contactNumber: p.contactNumber,
      email: p.email ?? "",
      address: p.address,
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
      bloodType: p.bloodType ?? "",
      guardianName: p.guardianName ?? "",
      guardianContactNumber: p.guardianContactNumber ?? "",
      emergencyContactName: p.emergencyContactName ?? "",
      emergencyContactNumber: p.emergencyContactNumber ?? "",
      healthConditions: p.healthConditions ?? "",
      allergies: p.medicalAlerts?.allergies?.join(", ") ?? "",
      chronicConditions: p.medicalAlerts?.chronicConditions?.join(", ") ?? "",
      currentMedications: p.medicalAlerts?.currentMedications?.join(", ") ?? "",
      medicalAlertNotes: p.medicalAlerts?.notes ?? "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const body: Record<string, unknown> = {
      ...form,
      age: Number(form.age),
      yearLevel: Number(form.yearLevel),
    };
    if (form.patientType === "student") {
      delete body.employeeId;
      delete body.department;
      delete body.position;
      delete body.emergencyContactName;
      delete body.emergencyContactNumber;
    } else {
      delete body.studentId;
      delete body.course;
      delete body.yearLevel;
      delete body.guardianName;
      delete body.guardianContactNumber;
    }
    delete body.allergies;
    delete body.chronicConditions;
    delete body.currentMedications;
    delete body.medicalAlertNotes;
    let clinicalProfilePayload: Record<string, unknown> | null = null;
    if (role === "nurse") {
      const commaList = (value: string) =>
        value.split(",").map((item) => item.trim()).filter(Boolean);
      clinicalProfilePayload = {
        familyHistory: editTarget?.familyHistory ?? "",
        pastMedicalHistory: form.healthConditions,
        allergies: commaList(form.allergies),
        currentMedications: commaList(form.currentMedications),
        chronicConditions: commaList(form.chronicConditions),
        notes: form.medicalAlertNotes || undefined,
      };
    }
    if (!form.email) delete body.email;
    if (!form.dateOfBirth) delete body.dateOfBirth;
    try {
      let savedPatientId: string;
      if (editTarget) {
        const res = await api.put<Patient>(`/patients/${editTarget._id}`, body);
        showToast(res.message);
        savedPatientId = res.data._id;
      } else {
        const res = await api.post<Patient>("/patients", body);
        showToast(res.message);
        savedPatientId = res.data._id;
      }
      if (clinicalProfilePayload) {
        await api.put(`/patients/${savedPatientId}/clinical-profile`, clinicalProfilePayload);
      }
      setShowModal(false);
      fetchPatients(page, search);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const checkInPatient = (patientId: string) => {
    navigate(
      embedded
        ? `/dashboard?view=visits&patientId=${encodeURIComponent(patientId)}`
        : `/patient-queue?patientId=${encodeURIComponent(patientId)}`,
    );
  };
  const openStudentRecord = (patientId: string) => {
    const returnTo = `${location.pathname}${location.search}`;
    navigate(`/patients/${patientId}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <PageFrame embedded={embedded}>
      {role === "admin" && !embedded && <div className="mb-5"><AdminSectionTabs active="management" /></div>}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">
            {isBasicView ? "Search Patients" : "Patient Records"}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Find a student, teacher, or staff member, review the record, or start a clinic visit.
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <button
              onClick={openCreate}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              + Register Patient
            </button>
          </div>
        )}
      </div>

      {canCheckIn && (
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span className="font-medium">Clinic workflow:</span> find the patient, select
          <span className="font-medium"> Check In</span>, then record vitals from the queue.
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <select
          value={patientTypeFilter}
          onChange={(e) => { setPatientTypeFilter(e.target.value); setPage(1); }}
          aria-label="Filter by patient type"
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="staff">Staff</option>
        </select>
        <input
          type="text"
          placeholder="Search by name, ID, department, or position…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm sm:max-w-sm"
        />
        <button type="submit" className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300 sm:self-start">
          Search
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {patients.length === 0 ? (
              <div className="rounded-lg bg-white py-8 text-center text-sm text-gray-400 shadow">
                No patients found.
              </div>
            ) : (
              patients.map((p) => (
                <article key={p._id} className="rounded-lg bg-white p-4 shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium text-gray-900">
                        {p.firstName} {p.lastName}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-gray-500">{patientIdentifier(p)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {patientTypeLabel(p)}
                    </span>
                  </div>
                  {!isBasicView && (
                    <>
                      <dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
                        <div>
                          <dt className="text-xs text-gray-400">Gender</dt>
                          <dd className="text-gray-700">{p.gender}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-400">Contact</dt>
                          <dd className="break-words text-gray-700">{p.contactNumber}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {role !== "admin" && (
                          <button
                            onClick={() => openStudentRecord(p._id)}
                            className="rounded border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            View Record
                          </button>
                        )}
                        {canCheckIn && (
                          <button
                            onClick={() => checkInPatient(p._id)}
                            className="rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Check In
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded border px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </article>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto rounded bg-white shadow md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Type / ID</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">School Information</th>
                  {!isBasicView && (
                    <>
                      <th className="text-left px-4 py-3">Gender</th>
                      <th className="text-left px-4 py-3">Contact</th>
                      <th className="px-4 py-3"></th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={isBasicView ? 3 : 6} className="text-center py-6 text-gray-400">
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><span className="mb-1 block w-fit rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{patientTypeLabel(p)}</span><span className="font-mono">{patientIdentifier(p)}</span></td>
                      <td className="px-4 py-3">{p.firstName} {p.lastName}</td>
                      <td className="px-4 py-3">{patientAffiliation(p) || "—"}</td>
                      {!isBasicView && (
                        <>
                          <td className="px-4 py-3">{p.gender}</td>
                          <td className="px-4 py-3">{p.contactNumber}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-3 whitespace-nowrap">
                            {role !== "admin" && (
                              <button
                                onClick={() => openStudentRecord(p._id)}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                View Record
                              </button>
                            )}
                            {role === "admin" && (
                              <span className="text-xs font-medium text-slate-400">Administrative view only</span>
                            )}
                            {canCheckIn && (
                              <button
                                onClick={() => checkInPatient(p._id)}
                                className="text-xs font-medium text-blue-600 hover:underline"
                              >
                                Check In
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => openEdit(p)}
                                className="text-gray-500 hover:underline text-xs"
                              >
                                Edit
                              </button>
                            )}
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* The basic view returns its full result set. */}
          {!isBasicView && totalPages > 1 && (
            <div className="flex gap-2 mt-4 items-center text-sm">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editTarget ? "Edit Patient" : "Register Patient"} onClose={() => setShowModal(false)} closeDisabled={saving}>
            {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {!editTarget && (
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 sm:col-span-2">
                  Select the patient category, then enter the applicable school and contact information.
                  Medical details can be updated by the nurse afterward.
                </p>
              )}
              <Field label="Patient Type">
                <select value={form.patientType} onChange={(e) => setForm({ ...form, patientType: e.target.value as PatientType })} className="input">
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                </select>
              </Field>
              <Field label={form.patientType === "student" ? "Student ID" : "Employee ID"}>
                <input
                  value={form.patientType === "student" ? form.studentId : form.employeeId}
                  onChange={(e) => form.patientType === "student" ? setForm({ ...form, studentId: e.target.value }) : setForm({ ...form, employeeId: e.target.value })}
                  required
                  className="input"
                />
              </Field>
              <Field label="First Name">
                <input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  className="input"
                />
              </Field>
              <Field label="Last Name">
                <input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                  className="input"
                />
              </Field>
              <Field label="Age">
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  readOnly={Boolean(form.dateOfBirth)}
                  required
                  min={1}
                  max={100}
                  className={`input ${form.dateOfBirth ? "bg-gray-50" : ""}`}
                />
                {form.dateOfBirth && <p className="mt-1 text-xs text-gray-500">Calculated automatically from date of birth.</p>}
              </Field>
              <Field label="Date of Birth">
                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={form.dateOfBirth}
                  onChange={(e) => {
                    const dateOfBirth = e.target.value;
                    setForm({ ...form, dateOfBirth, age: calculateAge(dateOfBirth) });
                  }}
                  className="input"
                />
              </Field>
              <Field label="Gender">
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="input"
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </Field>
              {form.patientType === "student" ? <>
                <Field label="Course">
                  <input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required className="input" />
                </Field>
                <Field label="Year Level">
                  <input type="number" value={form.yearLevel} onChange={(e) => setForm({ ...form, yearLevel: e.target.value })} required min={1} max={10} className="input" />
                </Field>
              </> : <>
                <Field label="Department">
                  <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required className="input" />
                </Field>
                <Field label="Position">
                  <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required className="input" />
                </Field>
              </>}
              <Field label="Contact Number">
                <input
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  required
                  className="input"
                />
              </Field>
              <Field label="Email (for appointment notifications)">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                  className="input"
                />
              </Field>
              {form.patientType === "student" ? <>
                <Field label="Guardian Name">
                  <input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} className="input" />
                </Field>
                <Field label="Guardian Emergency Contact Number">
                  <input value={form.guardianContactNumber} onChange={(e) => setForm({ ...form, guardianContactNumber: e.target.value })} className="input" />
                </Field>
              </> : <>
                <Field label="Emergency Contact Name">
                  <input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} required className="input" />
                </Field>
                <Field label="Emergency Contact Number">
                  <input value={form.emergencyContactNumber} onChange={(e) => setForm({ ...form, emergencyContactNumber: e.target.value })} required className="input" />
                </Field>
              </>}
              {role === "nurse" && (
                <>
                  <Field label="Blood Type">
                    <input value={form.bloodType} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} placeholder="e.g. O+" className="input" />
                  </Field>
                  <Field label="Health Conditions">
                    <input value={form.healthConditions} onChange={(e) => setForm({ ...form, healthConditions: e.target.value })} className="input" />
                  </Field>
                  <Field label="Allergies (comma-separated)" className="sm:col-span-2">
                    <input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="input" placeholder="Penicillin, peanuts" />
                  </Field>
                  <Field label="Chronic Conditions (comma-separated)">
                    <input value={form.chronicConditions} onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })} className="input" placeholder="Asthma, diabetes" />
                  </Field>
                  <Field label="Current Medications (comma-separated)">
                    <input value={form.currentMedications} onChange={(e) => setForm({ ...form, currentMedications: e.target.value })} className="input" />
                  </Field>
                  <Field label="Medical Alert Notes" className="sm:col-span-2">
                    <textarea value={form.medicalAlertNotes} onChange={(e) => setForm({ ...form, medicalAlertNotes: e.target.value })} className="input" rows={2} />
                  </Field>
                </>
              )}

              <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Register Patient"}
                </button>
              </div>
            </form>
        </Modal>
      )}
    </PageFrame>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

export default PatientsPage;
