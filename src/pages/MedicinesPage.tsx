import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageFrame from "../components/PageFrame";
import Modal from "../components/Modal";
import { MedicineIcon, ReportsIcon, VisitsIcon } from "../components/icons";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useFormErrors } from "../hooks/useFormErrors";
import { useToast } from "../hooks/useToast";
import { FieldError, UnmatchedFieldErrors } from "../components/FieldError";
import type { InventoryLabel, Medicine } from "../utils/types";
import {
  groupInventoryBySection,
  inventorySectionLabel,
} from "../features/inventory/inventorySections";
import InventorySectionSelector from "../features/inventory/InventorySectionSelector";

type InventoryFilter = "all" | "low" | "expiring" | "expired";

const FORM_FIELDS = [
  "name",
  "category",
  "inventorySection",
  "quantity",
  "unit",
  "expiryDate",
  "lowStockThreshold",
  "supplier",
  "batchNumber",
  "dateReceived",
];

const emptyForm = {
  name: "",
  category: "",
  inventorySection: "",
  quantity: "",
  unit: "",
  expiryDate: "",
  lowStockThreshold: "10",
  supplier: "",
  batchNumber: "",
  dateReceived: new Date().toISOString().slice(0, 10),
};

const emptyBatchForm = {
  batchNumber: "",
  quantityReceived: "",
  expiryDate: "",
  supplier: "",
  notes: "",
};

function MedicinesPage({ embedded = false }: { embedded?: boolean }) {
  const { can } = useAuth();
  const { showToast } = useToast();
  const canEdit = can("editMedicines");
  const [referenceTime] = useState(() => new Date());
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [inventoryLabels, setInventoryLabels] = useState<InventoryLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Medicine | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [batchTarget, setBatchTarget] = useState<Medicine | null>(null);
  const [batchForm, setBatchForm] = useState(emptyBatchForm);
  const [receiving, setReceiving] = useState(false);
  const {
    formError,
    fieldErrors,
    applyError,
    reset: resetFormErrors,
    clearField,
    unmatchedFieldErrors,
  } = useFormErrors();

  const fetchInventory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.getAll<Medicine>("/medicines");
      setMedicines(response.data);
      api.get<InventoryLabel[]>("/inventory-labels").then((result) => setInventoryLabels(result.data)).catch(() => {});
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api
      .getAll<Medicine>("/medicines")
      .then((response) => {
        if (!cancelled) setMedicines(response.data);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load inventory");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    api.get<InventoryLabel[]>("/inventory-labels").then((result) => {
      if (!cancelled) setInventoryLabels(result.data);
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const isLowStock = (medicine: Medicine) =>
    medicine.quantity <= medicine.lowStockThreshold;
  const isExpired = (medicine: Medicine) =>
    Boolean(medicine.expiryDate) && new Date(medicine.expiryDate!) < referenceTime;
  const isExpiringSoon = (medicine: Medicine) => {
    if (!medicine.expiryDate || isExpired(medicine)) return false;
    const threshold = new Date(referenceTime);
    threshold.setDate(threshold.getDate() + 30);
    return new Date(medicine.expiryDate) <= threshold;
  };

  const inventoryStats = useMemo(() => ({
    total: medicines.length,
    lowStock: medicines.filter(isLowStock).length,
    outOfStock: medicines.filter((medicine) => medicine.quantity <= 0).length,
    expiring: medicines.filter(isExpiringSoon).length,
    expired: medicines.filter(isExpired).length,
  // Status helpers use the stable page-load reference time.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [medicines, referenceTime]);

  const filteredMedicines = useMemo(() => {
    const query = search.trim().toLowerCase();
    return medicines.filter((medicine) => {
      const matchesSearch = !query ||
        `${medicine.name} ${medicine.category ?? ""} ${medicine.inventorySection ?? ""} ${medicine.supplier ?? ""}`
          .toLowerCase()
          .includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "low" && isLowStock(medicine)) ||
        (filter === "expiring" && isExpiringSoon(medicine)) ||
        (filter === "expired" && isExpired(medicine));
      return matchesSearch && matchesFilter;
    });
  // Status helpers use the stable page-load reference time.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, medicines, referenceTime, search]);

  const medicineGroups = useMemo(
    () => groupInventoryBySection(filteredMedicines),
    [filteredMedicines],
  );
  const labelDetails = (name: string) => inventoryLabels.find((label) => label.name === name);

  const lowStockItems = medicines.filter(isLowStock);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    resetFormErrors();
    setShowModal(true);
  };

  const openEdit = (medicine: Medicine) => {
    setEditTarget(medicine);
    setForm({
      name: medicine.name,
      category: medicine.category ?? "",
      inventorySection: medicine.inventorySection ?? "",
      quantity: String(medicine.quantity),
      unit: medicine.unit,
      expiryDate: medicine.expiryDate?.slice(0, 10) ?? "",
      lowStockThreshold: String(medicine.lowStockThreshold),
      supplier: medicine.supplier ?? "",
      batchNumber: "",
      dateReceived: medicine.dateReceived?.slice(0, 10) ?? "",
    });
    resetFormErrors();
    setShowModal(true);
  };

  const setField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    clearField(key);
  };

  const saveInventoryItem = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    resetFormErrors();
    const payload = {
      name: form.name,
      category: form.category || undefined,
      inventorySection: form.inventorySection || undefined,
      unit: form.unit,
      lowStockThreshold: Number(form.lowStockThreshold),
      supplier: form.supplier || undefined,
      ...(!editTarget ? {
        quantity: Number(form.quantity),
        expiryDate: form.expiryDate || undefined,
        batchNumber: form.batchNumber,
        dateReceived: form.dateReceived,
      } : {}),
    };

    try {
      const response = editTarget
        ? await api.put(`/medicines/${editTarget._id}`, payload)
        : await api.post("/medicines", payload);
      showToast(response.message);
      setShowModal(false);
      await fetchInventory();
    } catch (requestError: unknown) {
      applyError(requestError, "Failed to save inventory item");
    } finally {
      setSaving(false);
    }
  };

  const openBatch = (medicine: Medicine) => {
    setBatchTarget(medicine);
    setBatchForm({
      ...emptyBatchForm,
      supplier: medicine.supplier ?? "",
    });
  };

  const receiveBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!batchTarget) return;
    setReceiving(true);
    try {
      const response = await api.post(`/medicines/${batchTarget._id}/batches`, {
        batchNumber: batchForm.batchNumber,
        quantityReceived: Number(batchForm.quantityReceived),
        expiryDate: batchForm.expiryDate || undefined,
        supplier: batchForm.supplier || undefined,
        notes: batchForm.notes || undefined,
      });
      showToast(response.message);
      setBatchTarget(null);
      await fetchInventory();
    } catch (requestError: unknown) {
      showToast(requestError instanceof Error ? requestError.message : "Failed to receive stock", "error");
    } finally {
      setReceiving(false);
    }
  };

  return (
    <PageFrame embedded={embedded}>
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {!embedded && <p className="text-sm text-gray-500">Medicine stock and supplies</p>}
            <h2 className={`${embedded ? "text-xl" : "mt-1 text-2xl"} font-bold text-gray-900`}>
              Inventory
            </h2>
            {embedded && (
              <p className="mt-1 text-sm text-gray-500">
                Search stock, receive deliveries, and review items needing attention.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <>
                <Link
                  to={embedded ? "/dashboard?view=inventory-labels" : "/inventory-labels"}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Manage Labels
                </Link>
                <Link
                  to={embedded ? "/dashboard?view=purchase-requests&new=1&type=new" : "/purchase-requests?new=1&type=new"}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  Request New Item
                </Link>
                <button
                  type="button"
                  onClick={openCreate}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  + Record Received Item
                </button>
              </>
            )}
          </div>
        </div>

        <section className={`grid grid-cols-2 ${embedded ? "gap-2 lg:grid-cols-4" : "gap-4 xl:grid-cols-4"}`}>
          <InventoryStat compact={embedded} label="Total Items" value={inventoryStats.total} icon={<MedicineIcon />} tone="blue" />
          <InventoryStat compact={embedded} label="Low Stock Items" value={inventoryStats.lowStock} icon={<ReportsIcon />} tone="red" />
          <InventoryStat compact={embedded} label="Out of Stock" value={inventoryStats.outOfStock} icon={<VisitsIcon />} tone="red" />
          <InventoryStat compact={embedded} label="Expiring Soon" value={inventoryStats.expiring} icon={<ReportsIcon />} tone="amber" />
        </section>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {!embedded && !loading && lowStockItems.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-5 py-4">
              <div>
                <h3 className="font-semibold text-red-800">Low Stock Alerts</h3>
                <p className="mt-1 text-xs text-red-600">Items at or below their reorder level</p>
              </div>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                {lowStockItems.length}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {lowStockItems.slice(0, 5).map((medicine) => (
                <div key={medicine._id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{medicine.name}</p>
                    <p className="text-xs text-gray-500">
                      {medicine.category || "Uncategorized"} · Reorder at {medicine.lowStockThreshold} {medicine.unit}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                    {medicine.quantity} {medicine.unit} remaining
                  </span>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openBatch(medicine)}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium hover:bg-gray-50"
                      >
                        Receive Stock
                      </button>
                      <Link
                        to={embedded
                          ? `/dashboard?view=purchase-requests&new=1&medicineId=${medicine._id}`
                          : `/purchase-requests?new=1&medicineId=${medicine._id}`}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        Request Restock
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Inventory Items</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {canEdit ? "Manage medicine details, stock deliveries, and reorder levels." : "Read-only inventory view."}
                </p>
              </div>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, section, category, or supplier..."
                className="input lg:max-w-sm"
              />
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {([
                ["all", `All Items (${inventoryStats.total})`],
                ["low", `Low Stock (${inventoryStats.lowStock})`],
                ["expiring", `Expiring Soon (${inventoryStats.expiring})`],
                ["expired", `Expired (${inventoryStats.expired})`],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                    filter === id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-12 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : filteredMedicines.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-gray-500">
              No inventory items match this view.
            </p>
          ) : (
            <>
              <div className="divide-y divide-gray-100 md:hidden">
                {medicineGroups.map((group) => (
                  <section key={group.label}>
                    <h4 className="border-y border-slate-300 bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                      <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: labelDetails(group.label)?.color ?? "#64748b" }} />
                      {group.label}
                      {labelDetails(group.label)?.description && <span className="ml-2 normal-case font-normal text-slate-500">— {labelDetails(group.label)?.description}</span>}
                    </h4>
                    <div className="divide-y divide-gray-100">
                      {group.items.map((medicine) => (
                        <InventoryMobileCard
                          key={medicine._id}
                          medicine={medicine}
                          canEdit={canEdit}
                          low={isLowStock(medicine)}
                          expired={isExpired(medicine)}
                          expiring={isExpiringSoon(medicine)}
                          onEdit={openEdit}
                          onBatch={openBatch}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[920px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Current Stock</th>
                      <th className="px-5 py-3">Reorder Level</th>
                      <th className="px-5 py-3">Expiry Date</th>
                      <th className="px-5 py-3">Status</th>
                      {canEdit && <th className="px-5 py-3">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {medicineGroups.map((group) => (
                      <Fragment key={group.label}>
                        <tr>
                          <th
                            colSpan={canEdit ? 7 : 6}
                            scope="rowgroup"
                            className="border-y border-slate-300 bg-slate-100 px-5 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-700"
                          >
                            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: labelDetails(group.label)?.color ?? "#64748b" }} />
                            {group.label}
                            {labelDetails(group.label)?.description && <span className="ml-2 normal-case font-normal text-slate-500">— {labelDetails(group.label)?.description}</span>}
                          </th>
                        </tr>
                        {group.items.map((medicine) => (
                          <tr key={medicine._id} className="hover:bg-gray-50">
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900">{medicine.name}</p>
                              <p className="text-xs text-gray-400">{medicine.supplier || "No supplier recorded"}</p>
                            </td>
                            <td className="px-5 py-4 text-gray-600">{medicine.category || "Uncategorized"}</td>
                            <td className="px-5 py-4 font-medium">{medicine.quantity} {medicine.unit}</td>
                            <td className="px-5 py-4 text-gray-600">{medicine.lowStockThreshold} {medicine.unit}</td>
                            <td className="px-5 py-4 text-gray-600">{formatDate(medicine.expiryDate)}</td>
                            <td className="px-5 py-4">
                              <InventoryStatus
                                low={isLowStock(medicine)}
                                expired={isExpired(medicine)}
                                expiring={isExpiringSoon(medicine)}
                              />
                            </td>
                            {canEdit && (
                              <td className="whitespace-nowrap px-5 py-4">
                                <button type="button" onClick={() => openEdit(medicine)} className="text-xs font-medium text-gray-600 hover:text-gray-900">Edit</button>
                                <button type="button" onClick={() => openBatch(medicine)} className="ml-3 text-xs font-medium text-blue-600 hover:text-blue-800">Receive Stock</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      {showModal && (
        <Modal title={editTarget ? "Edit Inventory Item" : "Record Received Inventory Item"} onClose={() => setShowModal(false)} closeDisabled={saving}>
          {!editTarget && (
            <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              Use this form only after an inventory item has been received. To ask for approval before buying,
              use “Request New Item.”
            </p>
          )}
          {formError && <p className="mb-3 text-sm text-red-500">{formError}</p>}
          <UnmatchedFieldErrors errors={unmatchedFieldErrors(FORM_FIELDS)} />
          <form onSubmit={saveInventoryItem} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InventoryField label="Item Name *" error={fieldErrors.name}>
                <input value={form.name} onChange={(event) => setField("name", event.target.value)} required className={`input ${fieldErrors.name ? "input-error" : ""}`} />
              </InventoryField>
              <InventoryField label="Category" error={fieldErrors.category}>
                <input value={form.category} onChange={(event) => setField("category", event.target.value)} placeholder="e.g. Analgesic" className={`input ${fieldErrors.category ? "input-error" : ""}`} />
              </InventoryField>
              <InventoryField label="Inventory Section / Label" error={fieldErrors.inventorySection}>
                <InventorySectionSelector
                  value={form.inventorySection}
                  onChange={(value) => setField("inventorySection", value)}
                  existingLabels={medicines.map((medicine) => medicine.inventorySection)}
                  error={Boolean(fieldErrors.inventorySection)}
                />
              </InventoryField>
              {!editTarget && (
                <InventoryField label="Quantity *" error={fieldErrors.quantity}>
                  <input type="number" min={0} value={form.quantity} onChange={(event) => setField("quantity", event.target.value)} required className={`input ${fieldErrors.quantity ? "input-error" : ""}`} />
                </InventoryField>
              )}
              <InventoryField label="Unit *" error={fieldErrors.unit}>
                <input value={form.unit} onChange={(event) => setField("unit", event.target.value)} placeholder="tablets, bottles, ml" required className={`input ${fieldErrors.unit ? "input-error" : ""}`} />
              </InventoryField>
              <InventoryField label="Reorder Level *" error={fieldErrors.lowStockThreshold}>
                <input type="number" min={0} value={form.lowStockThreshold} onChange={(event) => setField("lowStockThreshold", event.target.value)} required className={`input ${fieldErrors.lowStockThreshold ? "input-error" : ""}`} />
              </InventoryField>
              {!editTarget && (
                <InventoryField label="Expiry Date" error={fieldErrors.expiryDate}>
                  <input type="date" value={form.expiryDate} onChange={(event) => setField("expiryDate", event.target.value)} required={Number(form.quantity) > 0} className={`input ${fieldErrors.expiryDate ? "input-error" : ""}`} />
                </InventoryField>
              )}
              {!editTarget && (
                <InventoryField label="Batch Number *" error={fieldErrors.batchNumber}>
                  <input value={form.batchNumber} onChange={(event) => setField("batchNumber", event.target.value)} required className={`input ${fieldErrors.batchNumber ? "input-error" : ""}`} />
                </InventoryField>
              )}
              {!editTarget && (
                <InventoryField label="Date Received *" error={fieldErrors.dateReceived}>
                  <input type="date" value={form.dateReceived} onChange={(event) => setField("dateReceived", event.target.value)} required className={`input ${fieldErrors.dateReceived ? "input-error" : ""}`} />
                </InventoryField>
              )}
            </div>
            <InventoryField label="Supplier" error={fieldErrors.supplier}>
              <input value={form.supplier} onChange={(event) => setField("supplier", event.target.value)} className={`input ${fieldErrors.supplier ? "input-error" : ""}`} />
            </InventoryField>
            <ModalActions onCancel={() => setShowModal(false)} busy={saving} submitLabel="Save Item" />
          </form>
        </Modal>
      )}

      {batchTarget && (
        <Modal title={`Receive Stock: ${batchTarget.name}`} onClose={() => setBatchTarget(null)} closeDisabled={receiving}>
          <form onSubmit={receiveBatch} className="space-y-4">
            <InventoryField label="Batch Number *"><input required value={batchForm.batchNumber} onChange={(event) => setBatchForm({ ...batchForm, batchNumber: event.target.value })} className="input" /></InventoryField>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InventoryField label="Quantity Received *"><input required type="number" min={1} value={batchForm.quantityReceived} onChange={(event) => setBatchForm({ ...batchForm, quantityReceived: event.target.value })} className="input" /></InventoryField>
              <InventoryField label="Expiry Date *"><input required type="date" value={batchForm.expiryDate} onChange={(event) => setBatchForm({ ...batchForm, expiryDate: event.target.value })} className="input" /></InventoryField>
            </div>
            <InventoryField label="Supplier"><input value={batchForm.supplier} onChange={(event) => setBatchForm({ ...batchForm, supplier: event.target.value })} className="input" /></InventoryField>
            <InventoryField label="Delivery Notes"><textarea rows={3} value={batchForm.notes} onChange={(event) => setBatchForm({ ...batchForm, notes: event.target.value })} className="input" /></InventoryField>
            <ModalActions onCancel={() => setBatchTarget(null)} busy={receiving} submitLabel="Record Delivery" />
          </form>
        </Modal>
      )}
    </PageFrame>
  );
}

function InventoryStat({ label, value, icon, tone, compact = false }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "blue" | "red" | "amber";
  compact?: boolean;
}) {
  const colors = { blue: "bg-blue-50 text-blue-600", red: "bg-red-50 text-red-600", amber: "bg-amber-50 text-amber-600" };
  return (
    <article className={`rounded-xl border border-gray-200 bg-white shadow-sm ${compact ? "p-3" : "p-5"}`}>
      <div className={`flex gap-3 ${compact ? "items-center" : "items-start justify-between"}`}>
        <span className={`rounded-lg ${compact ? "p-1.5" : "p-2"} ${colors[tone]}`}>{icon}</span>
        <div className={compact ? "min-w-0" : "contents"}>
          <p className={`${compact ? "truncate text-xs" : "text-sm"} font-medium text-gray-600`}>{label}</p>
          {compact && <p className="mt-0.5 text-xl font-bold text-gray-900">{value}</p>}
        </div>
      </div>
      {!compact && <p className="mt-6 text-3xl font-bold text-gray-900">{value}</p>}
    </article>
  );
}

function InventoryStatus({ low, expired, expiring }: { low: boolean; expired: boolean; expiring: boolean }) {
  if (expired) return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">Expired</span>;
  if (low) return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">Low Stock</span>;
  if (expiring) return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Expiring Soon</span>;
  return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">In Stock</span>;
}

function InventoryMobileCard({ medicine, canEdit, low, expired, expiring, onEdit, onBatch }: {
  medicine: Medicine;
  canEdit: boolean;
  low: boolean;
  expired: boolean;
  expiring: boolean;
  onEdit: (medicine: Medicine) => void;
  onBatch: (medicine: Medicine) => void;
}) {
  return (
    <article className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-gray-900">{medicine.name}</p>
          <p className="text-xs text-gray-500">
            {inventorySectionLabel(medicine.inventorySection)} · {medicine.category || "Uncategorized"}
          </p>
        </div>
        <InventoryStatus low={low} expired={expired} expiring={expiring} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <p><span className="block text-xs text-gray-400">Stock</span>{medicine.quantity} {medicine.unit}</p>
        <p><span className="block text-xs text-gray-400">Reorder at</span>{medicine.lowStockThreshold} {medicine.unit}</p>
        <p><span className="block text-xs text-gray-400">Expiry</span>{formatDate(medicine.expiryDate)}</p>
        <p><span className="block text-xs text-gray-400">Supplier</span>{medicine.supplier || "Not recorded"}</p>
      </div>
      {canEdit && (
        <div className="flex gap-2 border-t pt-3">
          <button type="button" onClick={() => onEdit(medicine)} className="rounded-lg border px-3 py-2 text-xs font-medium">Edit</button>
          <button type="button" onClick={() => onBatch(medicine)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white">Receive Stock</button>
        </div>
      )}
    </article>
  );
}

function InventoryField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-gray-600">
      {label}
      <div className="mt-1">{children}</div>
      <FieldError message={error} />
    </label>
  );
}

function ModalActions({ onCancel, busy, submitLabel }: { onCancel: () => void; busy: boolean; submitLabel: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
      <button type="submit" disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {busy ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default MedicinesPage;
