import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";
import type { Medicine, MedicineStatus } from "../utils/types";

const emptyForm = {
  name: "",
  category: "",
  quantity: "",
  unit: "",
  expiryDate: "",
  lowStockThreshold: "10",
  supplier: "",
};

function MedicinesPage() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const canEdit = can("editMedicines");
  const canSubmitPurchaseRequest = can("submitPurchaseRequest");

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Medicine | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [requestTarget, setRequestTarget] = useState<Medicine | null>(null);
  const [requestQty, setRequestQty] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState("");

  const fetchMedicines = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/medicines?limit=200");
      setMedicines(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (m: Medicine) => {
    setEditTarget(m);
    setForm({
      name: m.name,
      category: m.category ?? "",
      quantity: String(m.quantity),
      unit: m.unit,
      expiryDate: m.expiryDate ? m.expiryDate.slice(0, 10) : "",
      lowStockThreshold: String(m.lowStockThreshold),
      supplier: m.supplier ?? "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const body: Record<string, unknown> = {
      name: form.name,
      quantity: Number(form.quantity),
      unit: form.unit,
      lowStockThreshold: Number(form.lowStockThreshold),
    };
    if (form.category) body.category = form.category;
    if (form.expiryDate) body.expiryDate = form.expiryDate;
    if (form.supplier) body.supplier = form.supplier;

    try {
      if (editTarget) {
        const res = await api.put(`/medicines/${editTarget._id}`, body);
        showToast(res.message);
      } else {
        const res = await api.post("/medicines", body);
        showToast(res.message);
      }
      setShowModal(false);
      fetchMedicines();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/medicines/${deleteTarget._id}`);
      showToast(res.message);
      setDeleteTarget(null);
      fetchMedicines();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const openRequest = (m: Medicine) => {
    setRequestTarget(m);
    setRequestQty("");
    setRequestReason("");
    setRequestError("");
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTarget) return;
    setRequesting(true);
    setRequestError("");
    try {
      const res = await api.post("/purchase-requests", {
        medicineId: requestTarget._id,
        quantityRequested: Number(requestQty),
        reason: requestReason,
      });
      showToast(res.message);
      setRequestTarget(null);
    } catch (err: unknown) {
      setRequestError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setRequesting(false);
    }
  };

  const statusBadge: Record<MedicineStatus, string> = {
    Available: "bg-green-100 text-green-700",
    "Low Stock": "bg-red-100 text-red-700",
    "Out of Stock": "bg-red-100 text-red-700",
    Expired: "bg-amber-100 text-amber-700",
  };

  const rowHighlight = (status?: MedicineStatus) => {
    if (status === "Low Stock" || status === "Out of Stock") return "bg-red-50";
    if (status === "Expired") return "bg-amber-50";
    return "";
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Medicines</h2>
        {canEdit && (
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Medicine
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Quantity</th>
                <th className="text-left px-4 py-3">Unit</th>
                <th className="text-left px-4 py-3">Supplier</th>
                <th className="text-left px-4 py-3">Expiry Date</th>
                <th className="text-left px-4 py-3">Status</th>
                {(canEdit || canSubmitPurchaseRequest) && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {medicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-400">
                    No medicines found.
                  </td>
                </tr>
              ) : (
                medicines.map((m) => (
                  <tr key={m._id} className={`hover:bg-gray-50 ${rowHighlight(m.status)}`}>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.category || "—"}</td>
                    <td className="px-4 py-3">{m.quantity}</td>
                    <td className="px-4 py-3">{m.unit}</td>
                    <td className="px-4 py-3 text-gray-500">{m.supplier || "—"}</td>
                    <td className="px-4 py-3">
                      {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          m.status ? statusBadge[m.status] : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {m.status ?? "Unknown"}
                      </span>
                    </td>
                    {(canEdit || canSubmitPurchaseRequest) && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {canSubmitPurchaseRequest && (
                          <button
                            onClick={() => openRequest(m)}
                            className="text-blue-600 hover:underline text-xs mr-3"
                          >
                            Request Restock
                          </button>
                        )}
                        {canEdit && (
                          <>
                            <button
                              onClick={() => openEdit(m)}
                              className="text-gray-500 hover:underline text-xs mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(m)}
                              className="text-red-500 hover:underline text-xs"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editTarget ? "Edit Medicine" : "Add Medicine"} onClose={() => setShowModal(false)}>
            {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Category</label>
                <input
                  placeholder="e.g. Analgesic, First Aid, PPE"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Unit *</label>
                  <input
                    placeholder="e.g. tablets, ml"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    required
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min={0}
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Supplier</label>
                <input
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
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

      {deleteTarget && (
        <Modal title="Remove Medicine" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-gray-600 mb-4">
            Remove <span className="font-medium">{deleteTarget.name}</span> from inventory? This is meant for
            expired or discontinued items and cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Removing…" : "Remove"}
            </button>
          </div>
        </Modal>
      )}

      {requestTarget && (
        <Modal title={`Request Restock: ${requestTarget.name}`} onClose={() => setRequestTarget(null)}>
          {requestError && <p className="text-red-500 text-sm mb-3">{requestError}</p>}
          <form onSubmit={handleRequest} className="flex flex-col gap-3">
            <p className="text-sm text-gray-500">
              Currently {requestTarget.quantity} {requestTarget.unit} in stock
              {requestTarget.status ? ` (${requestTarget.status})` : ""}.
            </p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantity Requested *</label>
              <input
                type="number"
                min={1}
                value={requestQty}
                onChange={(e) => setRequestQty(e.target.value)}
                required
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reason *</label>
              <textarea
                rows={2}
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                required
                className="input w-full"
              />
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setRequestTarget(null)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={requesting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {requesting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}

export default MedicinesPage;