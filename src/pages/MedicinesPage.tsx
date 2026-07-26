import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useFormErrors } from "../hooks/useFormErrors";
import { useToast } from "../components/Toast";
import { FieldError, UnmatchedFieldErrors } from "../components/FieldError";
import type { Medicine } from "../utils/types";

const FORM_FIELDS = ["name", "quantity", "unit", "expiryDate", "lowStockThreshold"];

const emptyForm = {
  name: "",
  quantity: "",
  unit: "",
  expiryDate: "",
  lowStockThreshold: "10",
};

function MedicinesPage() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const canEdit = can("editMedicines");

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Medicine | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { formError, fieldErrors, applyError, reset: resetFormErrors, clearField, unmatchedFieldErrors } =
    useFormErrors();

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
    resetFormErrors();
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
    resetFormErrors();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    resetFormErrors();
    const body: Record<string, unknown> = {
      name: form.name,
      quantity: Number(form.quantity),
      unit: form.unit,
      lowStockThreshold: Number(form.lowStockThreshold),
    };
    if (form.expiryDate) body.expiryDate = form.expiryDate;

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
      applyError(err, "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    clearField(key);
  };

  const isLow = (m: Medicine) => m.quantity <= m.lowStockThreshold;

  const EXPIRING_SOON_DAYS = 30;
  const isExpired = (m: Medicine) => !!m.expiryDate && new Date(m.expiryDate) < new Date();
  const isExpiringSoon = (m: Medicine) => {
    if (!m.expiryDate) return false;
    const expiry = new Date(m.expiryDate);
    const soonThreshold = new Date(Date.now() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000);
    return expiry >= new Date() && expiry <= soonThreshold;
  };

  return (
    <Layout>
      <div className="page-shell">
        <div className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 p-6 text-white shadow-[0_25px_50px_-20px_rgba(37,99,235,0.55)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-blue-100">Inventory</p>
              <h2 className="mt-2 text-2xl font-semibold">Medicine Inventory</h2>
              <p className="mt-2 max-w-2xl text-sm text-blue-50/90">
                Monitor stock levels, expiry dates, and clinic supply status in one place.
              </p>
            </div>
            {canEdit && (
              <button
                onClick={openCreate}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-950/20 transition-all hover:-translate-y-0.5"
              >
                + Add Medicine
              </button>
            )}
          </div>
        </div>

        {error && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-blue-100 bg-white/80 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Loading medicines...</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)]">
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill pill-primary">Clinical Supplies</span>
                <span className="pill pill-secondary">Updated Today</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Stock Status</th>
                    <th className="px-4 py-3">Expiry Status</th>
                    {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                        No medicines found.
                      </td>
                    </tr>
                  ) : (
                    medicines.map((m) => (
                      <tr
                        key={m._id}
                        className={`transition-colors hover:bg-slate-50 ${
                          isLow(m) || isExpired(m)
                            ? "bg-red-50/60"
                            : isExpiringSoon(m)
                            ? "bg-amber-50/60"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-700">{m.name}</td>
                        <td className="px-4 py-3 text-slate-600">{m.quantity}</td>
                        <td className="px-4 py-3 text-slate-600">{m.unit}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {isLow(m) ? (
                            <span className="pill pill-danger">Low Stock</span>
                          ) : (
                            <span className="pill pill-success">In Stock</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isExpired(m) ? (
                            <span className="pill pill-danger">Expired</span>
                          ) : isExpiringSoon(m) ? (
                            <span className="pill pill-secondary">Expiring Soon</span>
                          ) : (
                            <span className="pill pill-success">OK</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openEdit(m)}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
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
          </div>
        )}

        {showModal && (
          <Modal title={editTarget ? "Edit Medicine" : "Add Medicine"} onClose={() => setShowModal(false)}>
            {formError && <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
            <UnmatchedFieldErrors errors={unmatchedFieldErrors(FORM_FIELDS)} />
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                  className={`input w-full ${fieldErrors.name ? "input-error" : ""}`}
                />
                <FieldError message={fieldErrors.name} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quantity *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.quantity}
                    onChange={(e) => setField("quantity", e.target.value)}
                    required
                    className={`input w-full ${fieldErrors.quantity ? "input-error" : ""}`}
                  />
                  <FieldError message={fieldErrors.quantity} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unit *</label>
                  <input
                    placeholder="e.g. tablets, ml"
                    value={form.unit}
                    onChange={(e) => setField("unit", e.target.value)}
                    required
                    className={`input w-full ${fieldErrors.unit ? "input-error" : ""}`}
                  />
                  <FieldError message={fieldErrors.unit} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setField("expiryDate", e.target.value)}
                    className={`input w-full ${fieldErrors.expiryDate ? "input-error" : ""}`}
                  />
                  <FieldError message={fieldErrors.expiryDate} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Low Stock Threshold</label>
                  <input
                    type="number"
                    min={0}
                    value={form.lowStockThreshold}
                    onChange={(e) => setField("lowStockThreshold", e.target.value)}
                    className={`input w-full ${fieldErrors.lowStockThreshold ? "input-error" : ""}`}
                  />
                  <FieldError message={fieldErrors.lowStockThreshold} />
                </div>
              </div>
              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:from-blue-700 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </Layout>
  );
}

export default MedicinesPage;