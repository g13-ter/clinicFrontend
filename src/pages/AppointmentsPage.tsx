import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";
import { patientsListPath } from "../config/permissions";
import type { Patient, Appointment, Doctor } from "../utils/types";

const STATUSES = ["pending", "confirmed", "cancelled", "completed"];

const emptyForm = {
  patientId: "",
  appointmentDate: "",
  reason: "",
  notes: "",
};

function patientIdToString(patientId: Patient | string | null): string {
  if (patientId == null) return "";
  if (typeof patientId === "object") return patientId._id;
  return patientId;
}

function AppointmentsPage() {
  const { role, can } = useAuth();
  const { showToast } = useToast();
  const canManage = can("manageAppointments");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editStatus, setEditStatus] = useState("pending");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const limit = 10;

  const fetchAppointments = async (p = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/appointments?page=${p}&limit=${limit}`);
      setAppointments(res.data);
      setTotal(res.pagination?.total ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(page);
  }, [page]);

  useEffect(() => {
    if (!canManage) return;
    const patientsPath = patientsListPath(role);
    if (!patientsPath) return;
    api.get<Patient[]>(patientsPath).then((res) => setPatients(res.data)).catch(() => {});
  }, [canManage, role]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (a: Appointment) => {
    setEditTarget(a);
    setEditStatus(a.status);
    setForm({
      patientId: patientIdToString(a.patientId),
      appointmentDate: a.appointmentDate.slice(0, 16),
      reason: a.reason,
      notes: a.notes ?? "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editTarget) {
        const res = await api.put(`/appointments/${editTarget._id}`, {
          appointmentDate: form.appointmentDate,
          reason: form.reason,
          notes: form.notes || undefined,
          status: editStatus,
        });
        showToast(res.message);
      } else {
        const res = await api.post("/appointments", {
          patientId: form.patientId,
          appointmentDate: form.appointmentDate,
          reason: form.reason,
          notes: form.notes || undefined,
        });
        showToast(res.message);
      }
      setShowModal(false);
      fetchAppointments(page);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-green-100 text-green-700",
  };

  const patientName = (p: Patient | string | null) => {
    if (p && typeof p === "object") return `${p.firstName} ${p.lastName} (${p.studentId})`;
    return p ? String(p) : "Unknown Patient";
  };

  const doctorName = (d: Doctor | string | null | undefined) => {
    if (d && typeof d === "object") return d.name;
    return d ? String(d) : "—";
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Appointments</h2>
        {canManage && (
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Appointment
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Patient</th>
                  <th className="text-left px-4 py-3">Doctor</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Reason</th>
                  <th className="text-left px-4 py-3">Status</th>
                  {canManage && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400">
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{patientName(a.patientId)}</td>
                      <td className="px-4 py-3">{doctorName(a.doctorId)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(a.appointmentDate).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">{a.reason}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            statusColor[a.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openEdit(a)}
                            className="text-gray-500 hover:underline text-xs"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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

      {showModal && (
        <Modal title={editTarget ? "Edit Appointment" : "New Appointment"} onClose={() => setShowModal(false)}>
            {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {!editTarget && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Patient *</label>
                  <select
                    value={form.patientId}
                    onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                    required
                    className="input w-full"
                  >
                    <option value="">Select a patient…</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.firstName} {p.lastName} ({p.studentId})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Appointment Date *</label>
                <input
                  type="datetime-local"
                  value={form.appointmentDate}
                  onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                  required
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Reason *</label>
                <input
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                  className="input w-full"
                />
              </div>
              {editTarget && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="input w-full"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div className="flex justify-end gap-2 mt-1">
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

export default AppointmentsPage;