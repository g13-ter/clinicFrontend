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

const emptyForm = {
  studentId: "",
  firstName: "",
  lastName: "",
  age: "",
  gender: "Male",
  course: "",
  yearLevel: "1",
  contactNumber: "",
  email: "",
  address: "",
  dateOfBirth: "",
  bloodType: "",
  guardianName: "",
  guardianContactNumber: "",
  healthConditions: "",
  allergies: "",
  chronicConditions: "",
  currentMedications: "",
  medicalAlertNotes: "",
  consentTreatment: false,
  consentMedicine: false,
  consentPrivacy: false,
};

function PageFrame({ embedded, children }: { embedded: boolean; children: ReactNode }) {
  return embedded ? <>{children}</> : <Layout>{children}</Layout>;
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

  const fetchPatients = async (p = page, q = search) => {
    setLoading(true);
    setError("");
    try {
      if (isBasicView) {
        const params = new URLSearchParams();
        if (q) params.set("search", q);
        const res = await api.get<Patient[]>(`/patients/basic?${params}`);
        setPatients(res.data);
        setTotal(res.data.length);
        return;
      }

      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (q) params.set("search", q);
      const res = await api.get<Patient[]>(`/patients?${params}`);
      setPatients(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch(requestedSearch);
    fetchPatients(page, requestedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, requestedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (search.trim()) next.set("search", search.trim());
    else next.delete("search");
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
      studentId: p.studentId,
      firstName: p.firstName,
      lastName: p.lastName,
      age: String(p.age),
      gender: p.gender,
      course: p.course,
      yearLevel: String(p.yearLevel),
      contactNumber: p.contactNumber,
      email: p.email ?? "",
      address: p.address,
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
      bloodType: p.bloodType ?? "",
      guardianName: p.guardianName ?? "",
      guardianContactNumber: p.guardianContactNumber ?? "",
      healthConditions: p.healthConditions ?? "",
      allergies: p.medicalAlerts?.allergies?.join(", ") ?? "",
      chronicConditions: p.medicalAlerts?.chronicConditions?.join(", ") ?? "",
      currentMedications: p.medicalAlerts?.currentMedications?.join(", ") ?? "",
      medicalAlertNotes: p.medicalAlerts?.notes ?? "",
      consentTreatment: p.consents?.treatment ?? false,
      consentMedicine: p.consents?.medicineAdministration ?? false,
      consentPrivacy: p.consents?.dataPrivacy ?? false,
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
    delete body.allergies;
    delete body.chronicConditions;
    delete body.currentMedications;
    delete body.medicalAlertNotes;
    delete body.consentTreatment;
    delete body.consentMedicine;
    delete body.consentPrivacy;
    if (role === "nurse" && editTarget) {
      const commaList = (value: string) =>
        value.split(",").map((item) => item.trim()).filter(Boolean);
      body.medicalAlerts = {
        allergies: commaList(form.allergies),
        chronicConditions: commaList(form.chronicConditions),
        currentMedications: commaList(form.currentMedications),
        notes: form.medicalAlertNotes || undefined,
      };
      body.consents = {
        treatment: form.consentTreatment,
        medicineAdministration: form.consentMedicine,
        dataPrivacy: form.consentPrivacy,
        guardianName: form.guardianName || undefined,
        updatedAt: new Date().toISOString(),
      };
    }
    if (!form.email) delete body.email;
    if (!form.dateOfBirth) delete body.dateOfBirth;
    try {
      if (editTarget) {
        const res = await api.put(`/patients/${editTarget._id}`, body);
        showToast(res.message);
      } else {
        const res = await api.post("/patients", body);
        showToast(res.message);
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
            {isBasicView ? "Search Students" : "Student Records"}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Find a student, review the record, or start a clinic visit.
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <button
              onClick={openCreate}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              + Register Student
            </button>
          </div>
        )}
      </div>

      {canCheckIn && (
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span className="font-medium">Clinic workflow:</span> find the student, select
          <span className="font-medium"> Check In</span>, then record vitals from the queue.
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Search by name or student ID…"
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
                No students found.
              </div>
            ) : (
              patients.map((p) => (
                <article key={p._id} className="rounded-lg bg-white p-4 shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium text-gray-900">
                        {p.firstName} {p.lastName}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-gray-500">{p.studentId}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {p.course} · Yr {p.yearLevel}
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
                  <th className="text-left px-4 py-3">Student ID</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Course / Year</th>
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
                      No students found.
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">{p.studentId}</td>
                      <td className="px-4 py-3">{p.firstName} {p.lastName}</td>
                      <td className="px-4 py-3">{p.course} — Yr {p.yearLevel}</td>
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
        <Modal title={editTarget ? "Edit Student" : "Register Student"} onClose={() => setShowModal(false)} closeDisabled={saving}>
            {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {!editTarget && (
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800 sm:col-span-2">
                  Enter the student&apos;s basic school, contact, and guardian information.
                  Medical details can be updated by the nurse afterward.
                </p>
              )}
              <Field label="Student ID">
                <input
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
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
                  required
                  min={1}
                  max={100}
                  className="input"
                />
              </Field>
              <Field label="Date of Birth">
                <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="input" />
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
              <Field label="Course">
                <input
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  required
                  className="input"
                />
              </Field>
              <Field label="Year Level">
                <input
                  type="number"
                  value={form.yearLevel}
                  onChange={(e) => setForm({ ...form, yearLevel: e.target.value })}
                  required
                  min={1}
                  max={10}
                  className="input"
                />
              </Field>
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
              <Field label="Guardian Name">
                <input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} className="input" />
              </Field>
              <Field label="Guardian Emergency Contact Number">
                <input value={form.guardianContactNumber} onChange={(e) => setForm({ ...form, guardianContactNumber: e.target.value })} className="input" />
              </Field>
              {role === "nurse" && editTarget && (
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
                  <div className="rounded-lg border p-3 sm:col-span-2">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Guardian Consent</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <ConsentCheck label="Treatment" checked={form.consentTreatment} onChange={(checked) => setForm({ ...form, consentTreatment: checked })} />
                      <ConsentCheck label="Medicine administration" checked={form.consentMedicine} onChange={(checked) => setForm({ ...form, consentMedicine: checked })} />
                      <ConsentCheck label="Data privacy" checked={form.consentPrivacy} onChange={(checked) => setForm({ ...form, consentPrivacy: checked })} />
                    </div>
                  </div>
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
                  {saving ? "Saving…" : editTarget ? "Save Changes" : "Register Student"}
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

function ConsentCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export default PatientsPage;
