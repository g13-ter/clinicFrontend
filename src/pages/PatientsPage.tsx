import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";
import type { Patient } from "../utils/types";

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
};

function PatientsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { can } = useAuth();
  const { showToast } = useToast();
  const canEdit = can("editPatients");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Patient | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const limit = 10;

  const fetchPatients = async (p = page, q = search) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (q) params.set("search", q);
      const res = await api.get(`/patients?${params}`);
      setPatients(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(page, search);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients(1, search);
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
    if (!form.email) delete body.email;
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

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Patients</h2>
        {canEdit && (
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Patient
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name or student ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm flex-1 max-w-sm"
        />
        <button type="submit" className="bg-gray-200 text-sm px-3 py-1.5 rounded hover:bg-gray-300">
          Search
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Student ID</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Course / Year</th>
                  <th className="text-left px-4 py-3">Gender</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400">
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">{p.studentId}</td>
                      <td className="px-4 py-3">{p.firstName} {p.lastName}</td>
                      <td className="px-4 py-3">{p.course} — Yr {p.yearLevel}</td>
                      <td className="px-4 py-3">{p.gender}</td>
                      <td className="px-4 py-3">{p.contactNumber}</td>
                      <td className="px-4 py-3 flex gap-2 justify-end">
                        <button
                          onClick={() => navigate(`/patients/${p._id}`)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => openEdit(p)}
                            className="text-gray-500 hover:underline text-xs"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
        <Modal title={editTarget ? "Edit Patient" : "Add Patient"} onClose={() => setShowModal(false)}>
            {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
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
              <Field label="Address" className="col-span-2">
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                  className="input"
                />
              </Field>

              <div className="col-span-2 flex justify-end gap-2 mt-2">
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
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
        </Modal>
      )}
    </Layout>
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