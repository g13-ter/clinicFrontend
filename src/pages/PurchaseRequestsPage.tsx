import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageFrame from "../components/PageFrame";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useFormErrors } from "../hooks/useFormErrors";
import { useToast } from "../hooks/useToast";
import { FieldError, UnmatchedFieldErrors } from "../components/FieldError";
import type { Medicine, PurchaseRequest, PurchaseRequestStatus } from "../utils/types";
import InventorySectionSelector from "../features/inventory/InventorySectionSelector";

const emptyForm = {
  requestType: "restock" as "restock" | "new_item",
  medicineId: "",
  itemName: "",
  unit: "",
  category: "",
  inventorySection: "",
  quantityRequested: "",
  reason: "",
};
const CREATE_FORM_FIELDS = Object.keys(emptyForm);
const REVIEW_FORM_FIELDS = ["status", "reviewNotes"];

function displayName(value: { name: string } | string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  if (typeof value === "object") return value.name;
  return value;
}

function PurchaseRequestsPage({ embedded = false }: { embedded?: boolean }) {
  const { can } = useAuth();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const canSubmit = can("submitPurchaseRequest");
  const canReview = can("reviewPurchaseRequest");
  const requestedMedicineId = searchParams.get("medicineId") ?? "";
  const requestedType = searchParams.get("type") === "new" ? "new_item" : "restock";
  const shouldOpenCreate = searchParams.get("new") === "1" && canSubmit;

  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(shouldOpenCreate);
  const [form, setForm] = useState({
    ...emptyForm,
    requestType: requestedMedicineId ? "restock" : requestedType,
    medicineId: shouldOpenCreate ? requestedMedicineId : "",
    reason: shouldOpenCreate ? "Restock required because the item is at or below its reorder level." : "",
  });
  const {
    formError: createFormError,
    fieldErrors: createFieldErrors,
    applyError: applyCreateError,
    reset: resetCreateErrors,
    clearField: clearCreateField,
    unmatchedFieldErrors: unmatchedCreateErrors,
  } = useFormErrors();
  const [saving, setSaving] = useState(false);

  const [reviewTarget, setReviewTarget] = useState<PurchaseRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const {
    formError: reviewFormError,
    applyError: applyReviewError,
    reset: resetReviewErrors,
    unmatchedFieldErrors: unmatchedReviewErrors,
  } = useFormErrors();
  const [reviewing, setReviewing] = useState(false);
  const [operation, setOperation] = useState<{
    mode: "order" | "receive" | "cancel";
    request: PurchaseRequest;
  } | null>(null);
  const [operationForm, setOperationForm] = useState({
    supplier: "",
    estimatedCost: "",
    batchNumber: "",
    quantityReceived: "",
    expiryDate: "",
    reviewNotes: "",
  });
  const [operationError, setOperationError] = useState("");
  const [operationBusy, setOperationBusy] = useState(false);

  const fetchRequests = async (requestedPage = page) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(requestedPage), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const query = `?${params.toString()}`;
      const res = await api.get<PurchaseRequest[]>(`/purchase-requests${query}`);
      setRequests(res.data);
      setPage(res.pagination?.page ?? requestedPage);
      setTotalPages(res.pagination?.totalPages ?? 1);
      setTotalRequests(res.pagination?.total ?? res.data.length);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load purchase requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchRequests(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (!canSubmit) return;
    api
      .getAll<Medicine>("/medicines")
      .then((res) => setMedicines(res.data))
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : "Failed to load inventory choices");
      });
  }, [canSubmit]);

  const openCreate = (requestType: "restock" | "new_item" = "new_item") => {
    setForm({ ...emptyForm, requestType });
    resetCreateErrors();
    setShowCreateModal(true);
  };

  const f = <K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    clearCreateField(k);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    resetCreateErrors();
    try {
      const res = await api.post("/purchase-requests", {
        ...(form.requestType === "restock"
          ? { medicineId: form.medicineId }
          : {
              itemName: form.itemName,
              unit: form.unit,
              category: form.category || undefined,
              inventorySection: form.inventorySection || undefined,
            }),
        quantityRequested: Number(form.quantityRequested),
        reason: form.reason,
      });
      showToast(res.message);
      setShowCreateModal(false);
      fetchRequests();
    } catch (err: unknown) {
      applyCreateError(err, "Submission failed");
    } finally {
      setSaving(false);
    }
  };

  const openReview = (r: PurchaseRequest) => {
    setReviewTarget(r);
    setReviewNotes("");
    resetReviewErrors();
  };

  const handleReview = async (status: "approved" | "rejected") => {
    if (!reviewTarget) return;
    setReviewing(true);
    resetReviewErrors();
    try {
      const res = await api.put(`/purchase-requests/${reviewTarget._id}/review`, {
        status,
        reviewNotes: reviewNotes || undefined,
      });
      showToast(res.message);
      setReviewTarget(null);
      fetchRequests();
    } catch (err: unknown) {
      applyReviewError(err, "Review failed");
    } finally {
      setReviewing(false);
    }
  };

  const statusColor: Record<PurchaseRequestStatus, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    ordered: "bg-blue-100 text-blue-700",
    received: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  const openOperation = (
    mode: "order" | "receive" | "cancel",
    request: PurchaseRequest,
  ) => {
    setOperation({ mode, request });
    setOperationForm({
      supplier: request.supplier ?? "",
      estimatedCost: "",
      batchNumber: "",
      quantityReceived: String(request.quantityRequested),
      expiryDate: "",
      reviewNotes: "",
    });
    setOperationError("");
  };

  const submitOperation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!operation) return;
    setOperationBusy(true);
    setOperationError("");
    try {
      const { mode, request } = operation;
      const path = mode === "order"
        ? `/purchase-requests/${request._id}/order`
        : mode === "receive"
          ? `/purchase-requests/${request._id}/receive`
          : `/purchase-requests/${request._id}/cancel`;
      const body = mode === "order"
        ? {
            supplier: operationForm.supplier || undefined,
            estimatedCost: operationForm.estimatedCost
              ? Number(operationForm.estimatedCost)
              : undefined,
          }
        : mode === "receive"
          ? {
              batchNumber: operationForm.batchNumber,
              quantityReceived: Number(operationForm.quantityReceived),
              expiryDate: operationForm.expiryDate || undefined,
              supplier: operationForm.supplier || undefined,
            }
          : { reviewNotes: operationForm.reviewNotes || undefined };
      const response = await api.put(path, body);
      showToast(response.message);
      setOperation(null);
      fetchRequests();
    } catch (requestError: unknown) {
      setOperationError(requestError instanceof Error ? requestError.message : "Could not update request");
    } finally {
      setOperationBusy(false);
    }
  };

  return (
    <PageFrame embedded={embedded}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Requests</h2>
          <p className="mt-1 text-sm text-gray-500">
            Request approval to restock an existing item or purchase a new clinic item.
          </p>
        </div>
        {canSubmit && (
          <button
            onClick={() => openCreate("new_item")}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Request Item
          </button>
        )}
      </div>

      <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Purchase request:</strong> asks the admin for approval before buying.
        After delivery, use <strong>Receive Delivery</strong>. The system creates the
        inventory batch and updates available stock automatically.
      </div>

      <div className="mb-4 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
        {(["", "pending", "approved", "ordered", "received", "rejected", "cancelled"] as const).map((s) => (
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
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Request Type</th>
                <th className="text-left px-4 py-3">Qty Requested</th>
                <th className="text-left px-4 py-3">Reason</th>
                <th className="text-left px-4 py-3">Requested By</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Reviewed By</th>
                {(canReview || canSubmit) && <th className="px-4 py-3">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-400">
                    No purchase requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{r.itemName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {r.requestType === "new_item" ? "New item" : "Restock"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.quantityRequested} {r.unit ?? ""}</td>
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
                    {(canReview || canSubmit) && (
                      <td className="px-4 py-3 text-right">
                        {canReview && r.status === "pending" ? (
                          <div className="flex justify-end gap-3">
                            <button onClick={() => openReview(r)} className="text-blue-600 hover:underline text-xs">
                              Review
                            </button>
                            <button onClick={() => openOperation("cancel", r)} className="text-red-600 hover:underline text-xs">
                              Cancel
                            </button>
                          </div>
                        ) : canReview && (r.status === "approved" || r.status === "ordered") ? (
                          <div className="flex justify-end gap-3">
                            {r.status === "approved" && (
                              <button onClick={() => openOperation("order", r)} className="text-blue-600 hover:underline text-xs">
                                Mark Ordered
                              </button>
                            )}
                            <button onClick={() => openOperation("cancel", r)} className="text-red-600 hover:underline text-xs">
                              Cancel
                            </button>
                          </div>
                        ) : canSubmit && (r.status === "approved" || r.status === "ordered") ? (
                          <button onClick={() => openOperation("receive", r)} className="text-emerald-700 hover:underline text-xs">
                            Receive Delivery
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">No action</span>
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

      {!loading && totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Purchase request pages">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} · {totalRequests} requests
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => fetchRequests(page - 1)}
              className="rounded border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => fetchRequests(page + 1)}
              className="rounded border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </nav>
      )}

      {showCreateModal && (
        <Modal title="New Purchase Request" onClose={() => setShowCreateModal(false)} closeDisabled={saving}>
          {createFormError && <p className="text-red-500 text-sm mb-3">{createFormError}</p>}
          <UnmatchedFieldErrors errors={unmatchedCreateErrors(CREATE_FORM_FIELDS)} />
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">What do you want to request?</label>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => f("requestType", "restock")}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${form.requestType === "restock" ? "bg-white shadow-sm" : "text-gray-600"}`}
                >
                  Restock Existing
                </button>
                <button
                  type="button"
                  onClick={() => f("requestType", "new_item")}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${form.requestType === "new_item" ? "bg-white shadow-sm" : "text-gray-600"}`}
                >
                  New Item
                </button>
              </div>
            </div>
            {form.requestType === "restock" ? (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Existing Inventory Item *</label>
              <select
                value={form.medicineId}
                onChange={(e) => f("medicineId", e.target.value)}
                required
                className={`input w-full ${createFieldErrors.medicineId ? "input-error" : ""}`}
              >
                <option value="">Select an item…</option>
                {medicines.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.quantity} {m.unit} in stock{m.status ? ` — ${m.status}` : ""})
                  </option>
                ))}
              </select>
              <FieldError message={createFieldErrors.medicineId} />
            </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500">Item Name *</label>
                  <input
                    value={form.itemName}
                    onChange={(e) => f("itemName", e.target.value)}
                    required
                    placeholder="e.g. Cetirizine, oxygen inhalation, or glucose strips"
                    className={`input w-full ${createFieldErrors.itemName ? "input-error" : ""}`}
                  />
                  <FieldError message={createFieldErrors.itemName} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Unit *</label>
                  <input
                    value={form.unit}
                    onChange={(e) => f("unit", e.target.value)}
                    required
                    placeholder="tablets, bottles, boxes"
                    className={`input w-full ${createFieldErrors.unit ? "input-error" : ""}`}
                  />
                  <FieldError message={createFieldErrors.unit} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Category</label>
                  <input
                    value={form.category}
                    onChange={(e) => f("category", e.target.value)}
                    placeholder="e.g. Antihistamine"
                    className="input w-full"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500">Inventory Section / Label</label>
                  <InventorySectionSelector
                    value={form.inventorySection}
                    onChange={(value) => f("inventorySection", value)}
                    existingLabels={medicines.map((medicine) => medicine.inventorySection)}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantity Requested *</label>
              <input
                type="number"
                min={1}
                value={form.quantityRequested}
                onChange={(e) => f("quantityRequested", e.target.value)}
                required
                className={`input w-full ${createFieldErrors.quantityRequested ? "input-error" : ""}`}
              />
              <FieldError message={createFieldErrors.quantityRequested} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Reason *</label>
              <textarea
                rows={2}
                value={form.reason}
                onChange={(e) => f("reason", e.target.value)}
                required
                className={`input w-full ${createFieldErrors.reason ? "input-error" : ""}`}
              />
              <FieldError message={createFieldErrors.reason} />
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
        <Modal title={`Review Request: ${reviewTarget.itemName}`} onClose={() => setReviewTarget(null)} closeDisabled={reviewing}>
          {reviewFormError && <p className="text-red-500 text-sm mb-3">{reviewFormError}</p>}
          <UnmatchedFieldErrors errors={unmatchedReviewErrors(REVIEW_FORM_FIELDS)} />
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

      {operation && (
        <Modal
          title={
            operation.mode === "order"
              ? `Record Order: ${operation.request.itemName}`
              : operation.mode === "receive"
                ? `Receive Delivery: ${operation.request.itemName}`
                : `Cancel Request: ${operation.request.itemName}`
          }
          onClose={() => setOperation(null)}
          closeDisabled={operationBusy}
        >
          <form onSubmit={submitOperation} className="space-y-4">
            {operationError && <p className="text-sm text-red-600">{operationError}</p>}
            {operation.mode === "order" && (
              <>
                <label className="block text-xs font-medium text-gray-600">
                  Supplier
                  <input
                    value={operationForm.supplier}
                    onChange={(event) => setOperationForm((current) => ({ ...current, supplier: event.target.value }))}
                    className="input mt-1"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-600">
                  Estimated total cost
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={operationForm.estimatedCost}
                    onChange={(event) => setOperationForm((current) => ({ ...current, estimatedCost: event.target.value }))}
                    className="input mt-1"
                  />
                </label>
              </>
            )}
            {operation.mode === "receive" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-gray-600">
                  Batch or lot number *
                  <input
                    value={operationForm.batchNumber}
                    onChange={(event) => setOperationForm((current) => ({ ...current, batchNumber: event.target.value }))}
                    required
                    className="input mt-1"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-600">
                  Quantity received *
                  <input
                    type="number"
                    min="1"
                    value={operationForm.quantityReceived}
                    onChange={(event) => setOperationForm((current) => ({ ...current, quantityReceived: event.target.value }))}
                    required
                    className="input mt-1"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-600">
                  Expiry date *
                  <input
                    type="date"
                    required
                    value={operationForm.expiryDate}
                    onChange={(event) => setOperationForm((current) => ({ ...current, expiryDate: event.target.value }))}
                    className="input mt-1"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-600">
                  Supplier
                  <input
                    value={operationForm.supplier}
                    onChange={(event) => setOperationForm((current) => ({ ...current, supplier: event.target.value }))}
                    className="input mt-1"
                  />
                </label>
              </div>
            )}
            {operation.mode === "cancel" && (
              <>
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  The request will remain in history with a cancelled status.
                </p>
                <label className="block text-xs font-medium text-gray-600">
                  Cancellation reason
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={operationForm.reviewNotes}
                    onChange={(event) => setOperationForm((current) => ({ ...current, reviewNotes: event.target.value }))}
                    className="input mt-1"
                  />
                </label>
              </>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOperation(null)} className="rounded-lg border px-4 py-2 text-sm">
                Go Back
              </button>
              <button
                type="submit"
                disabled={operationBusy}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {operationBusy ? "Saving..." : operation.mode === "cancel" ? "Cancel Request" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PageFrame>
  );
}


export default PurchaseRequestsPage;
