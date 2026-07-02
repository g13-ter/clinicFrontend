import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { getCurrentRole } from "../utils/auth";
import type { Medicine } from "../utils/types";

const emptyForm = {
  name: "",
  quantity: "",
  unit: "",
  expiryDate: "",
  lowStockThreshold: "10",
};

function MedicinesPage() {
  const role = getCurrentRole();
  const canEdit = role === "nurse";

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Medicine | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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
      quantity: String(m.quantity),
      unit: m.unit,
      expiryDate: m.expiryDate ? m.expiryDate.slice(0, 10) : "",
      lowStockThreshold: String(m.lowStockThreshold),
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
    if (form.expiryDate) body.expiryDate = form.expiryDate;

    try {
      if (editTarget) {
        await api.put(`/medicines/${editTarget._id}`, body);
      } else {
        await api.post("/medicines", body);
      }
      setShowModal(false);
      fetchMedicines();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const isLow = (m: Medicine) => m.quantity <= m.lowStockThreshold;

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
                <th className="text-left px-4 py-3">Quantity</th>
                <th className="text-left px-4 py-3">Unit</th>
                <th className="text-left px-4 py-3">Expiry Date</th>
                <th className="text-left px-4 py-3">Stock Status</th>
                {canEdit && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {medicines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    No medicines found.
                  </td>
                </tr>
              ) : (
                medicines.map((m) => (
                  <tr key={m._id} className={`hover:bg-gray-50 ${isLow(m) ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3">{m.quantity}</td>
                    <td className="px-4 py-3">{m.unit}</td>
                    <td className="px-4 py-3">
                      {m.expiryDate
                        ? new Date(m.expiryDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {isLow(m) ? (
                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-xs text-green-600">OK</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(m)}
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

export default MedicinesPage;
