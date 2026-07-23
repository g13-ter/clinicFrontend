import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";
import type { Medicine, PurchaseRequest, PurchaseRequestStatus } from "../utils/types";

const emptyForm = {
  medicineId: "",
  quantityRequested: "",
  reason: "",
};

function displayName(value: { name: string } | string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  if (typeof value === "object") return value.name;
  return value;
}

function PurchaseRequestsPage() {
  const { can } = useAuth();
  const { showToast } = useToast();
  const canSubmit = can("submitPurchaseRequest");
  const canReview = can("reviewPurchaseRequest");

  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [reviewTarget, setReviewTarget] = useState<PurchaseRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const res = await api.get<PurchaseRequest[]>(`/purchase-requests${query}`);
      setRequests(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load purchase requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (!canSubmit) return;
    api
      .get<Medicine[]>("/medicines?limit=200")
      .then((res) => setMedicines(res.data))
      .catch(() => {});
  }, [canSubmit]);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError("");
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const res = await api.post("/purchase-requests", {
        medicineId: form.medicineId,
        quantityRequested: Number(form.quantityRequested),
        reason: form.reason,
      });
      showToast(res.message);
      setShowCreateModal(false);
      fetchRequests();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSaving(false);
    }
  };

  const openReview = (r: PurchaseRequest) => {
    setReviewTarget(r);
    setReviewNotes("");
  };

  const handleReview = async (status: "approved" | "rejected") => {
    if (!reviewTarget) return;
    setReviewing(true);
    try {
      const res = await api.put(`/purchase-requests/${reviewTarget._id}/review`, {
        status,
        reviewNotes: reviewNotes || undefined,
      });
      showToast(res.message);
      setReviewTarget(null);
      fetchRequests();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Review failed");
    } finally {
      setReviewing(false);
    }
  };

  const statusColor: Record<PurchaseRequestStatus, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Purchase Requests</h2>
        {canSubmit && (
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Request
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(["", "pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
              statusFilter === s
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {s === "" ? "All" : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Qty Requested</th>
                <th className="text-left px-4 py-3">Reason</th>
                <th className="text-left px-4 py-3">Requested By</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Reviewed By</th>
                {canReview && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-400">
                    No purchase requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.itemName}</td>
                    <td className="px-4 py-3">{r.quantityRequested}</td>
                    <td className="px-4 py-3 max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="px-4 py-3">{displayName(r.requestedBy)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{displayName(r.reviewedBy)}</td>
                    {canReview && (
                      <td className="px-4 py-3 text-right">
                        {r.status === "pending" ? (
                          <button
                            onClick={() => openReview(r)}
                            className="text-blue-600 hover:underline text-xs"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">Reviewed</span>
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

      {showCreateModal && (
        <Modal title="New Purchase Request" onClose={() => setShowCreateModal(false)}>
          {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Item *</label>
              <select
                value={form.medicineId}
                onChange={(e) => setForm({ ...form, medicineId: e.target.value })}
                required
                className="input w-full"
              >
                <option value="">Select an item…</option>
                {medicines.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.quantity} {m.unit} in stock{m.status ? ` — ${m.status}` : ""})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantity Requested *</label>
              <input
                type="number"
                min={1}
                value={form.quantityRequested}
                onChange={(e) => setForm({ ...form, quantityRequested: e.target.value })}
                required
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reason *</label>
              <textarea
                rows={2}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
                className="input w-full"
              />
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {reviewTarget && (
        <Modal title={`Review Request: ${reviewTarget.itemName}`} onClose={() => setReviewTarget(null)}>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{displayName(reviewTarget.requestedBy)}</span> requested{" "}
              <span className="font-medium">{reviewTarget.quantityRequested}</span> unit(s) of{" "}
              <span className="font-medium">{reviewTarget.itemName}</span>.
            </p>
            <p className="text-sm text-gray-500 italic">"{reviewTarget.reason}"</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Review Notes (optional)</label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => handleReview("rejected")}
                disabled={reviewing}
                className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleReview("approved")}
                disabled={reviewing}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}

export default PurchaseRequestsPage;