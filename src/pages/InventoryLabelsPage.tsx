import { useCallback, useEffect, useState } from "react";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import { api } from "../services/api";
import { useToast } from "../hooks/useToast";
import type { InventoryLabel, InventoryLabelActivity, Medicine } from "../utils/types";

const blank = { name: "", description: "", color: "#64748b" };

export default function InventoryLabelsPage({ embedded = false }: { embedded?: boolean }) {
  const { showToast } = useToast();
  const [labels, setLabels] = useState<InventoryLabel[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [targetLabelId, setTargetLabelId] = useState("");
  const [editing, setEditing] = useState<InventoryLabel | "new" | null>(null);
  const [form, setForm] = useState(blank);
  const [mergeSource, setMergeSource] = useState<InventoryLabel | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activity, setActivity] = useState<InventoryLabelActivity[]>([]);

  const reload = useCallback(async () => {
    try {
      const [labelResponse, medicineResponse, activityResponse] = await Promise.all([
        api.get<InventoryLabel[]>("/inventory-labels"),
        api.getAll<Medicine>("/medicines"),
        api.get<InventoryLabelActivity[]>("/inventory-labels/activity"),
      ]);
      setLabels(labelResponse.data);
      setMedicines(medicineResponse.data);
      setActivity(activityResponse.data);
      setError("");
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Labels could not be loaded");
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const response = editing === "new"
        ? await api.post("/inventory-labels", form)
        : await api.put(`/inventory-labels/${editing._id}`, form);
      showToast(response.message);
      setEditing(null);
      await reload();
    } catch (requestError: unknown) { showToast(requestError instanceof Error ? requestError.message : "Label could not be saved", "error"); }
    finally { setBusy(false); }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= labels.length) return;
    const ordered = [...labels];
    [ordered[index], ordered[nextIndex]] = [ordered[nextIndex]!, ordered[index]!];
    setLabels(ordered);
    try {
      await api.put("/inventory-labels/order", { labelIds: ordered.map((label) => label._id) });
    } catch (requestError: unknown) { showToast(requestError instanceof Error ? requestError.message : "Order could not be saved", "error"); await reload(); }
  };

  const assign = async () => {
    if (!targetLabelId || selectedItems.length === 0) return;
    setBusy(true);
    try {
      const response = await api.post(`/inventory-labels/${targetLabelId}/assign`, { medicineIds: selectedItems });
      showToast(response.message);
      setSelectedItems([]);
      await reload();
    } catch (requestError: unknown) { showToast(requestError instanceof Error ? requestError.message : "Items could not be reassigned", "error"); }
    finally { setBusy(false); }
  };

  const archive = async (label: InventoryLabel) => {
    if (!window.confirm(`Archive “${label.name}”?`)) return;
    try { const response = await api.delete(`/inventory-labels/${label._id}`); showToast(response.message); await reload(); }
    catch (requestError: unknown) { showToast(requestError instanceof Error ? requestError.message : "Label could not be archived", "error"); }
  };

  const merge = async () => {
    if (!mergeSource || !mergeTargetId) return;
    setBusy(true);
    try { const response = await api.post(`/inventory-labels/${mergeSource._id}/merge`, { targetLabelId: mergeTargetId }); showToast(response.message); setMergeSource(null); await reload(); }
    catch (requestError: unknown) { showToast(requestError instanceof Error ? requestError.message : "Labels could not be merged", "error"); }
    finally { setBusy(false); }
  };

  const content = <div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold">Manage Inventory Labels</h2><p className="mt-1 text-sm text-gray-500">Control report headings, descriptions, colors, order, and item assignments.</p></div><button type="button" onClick={() => { setEditing("new"); setForm(blank); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">+ Add Label</button></div>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm"><div className="divide-y">{labels.map((label, index) => <article key={label._id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
      <span className="h-8 w-2 rounded" style={{ backgroundColor: label.color }} aria-hidden="true" />
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{label.name}</h3>{label.isSystem && <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px]">Standard</span>}<span className="text-xs text-gray-500">{label.itemCount} item(s)</span></div><p className="mt-1 text-sm text-gray-500">{label.description || "No description"}</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" aria-label={`Move ${label.name} up`} disabled={index === 0} onClick={() => void move(index, -1)} className="rounded border px-2 py-1 disabled:opacity-30">↑</button><button type="button" aria-label={`Move ${label.name} down`} disabled={index === labels.length - 1} onClick={() => void move(index, 1)} className="rounded border px-2 py-1 disabled:opacity-30">↓</button><button type="button" onClick={() => { setEditing(label); setForm({ name: label.name, description: label.description ?? "", color: label.color }); }} className="rounded border px-3 py-1 text-sm">Edit</button><button type="button" disabled={label.isSystem} title={label.isSystem ? "Standard labels cannot be merged" : undefined} onClick={() => { setMergeSource(label); setMergeTargetId(""); }} className="rounded border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-40">Merge</button><button type="button" disabled={label.isSystem} title={label.isSystem ? "Standard labels cannot be archived" : undefined} onClick={() => void archive(label)} className="rounded border border-red-200 px-3 py-1 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-40">Archive</button></div>
    </article>)}</div></section>

    <section className="rounded-xl border bg-white p-5 shadow-sm"><h3 className="font-semibold">Bulk Reassign Items</h3><p className="mt-1 text-sm text-gray-500">Select several inventory items and move them to one label.</p><div className="mt-4 grid max-h-72 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-3">{medicines.map((medicine) => <label key={medicine._id} className="flex gap-2 text-sm"><input type="checkbox" checked={selectedItems.includes(medicine._id)} onChange={(event) => setSelectedItems((current) => event.target.checked ? [...current, medicine._id] : current.filter((id) => id !== medicine._id))} /><span>{medicine.name}<small className="block text-gray-400">{medicine.inventorySection || "Uncategorized"}</small></span></label>)}</div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><select value={targetLabelId} onChange={(event) => setTargetLabelId(event.target.value)} className="input"><option value="">Move selected items to...</option>{labels.map((label) => <option key={label._id} value={label._id}>{label.name}</option>)}</select><button type="button" disabled={busy || !targetLabelId || selectedItems.length === 0} onClick={() => void assign()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Move {selectedItems.length} Item(s)</button></div></section>

    <section className="rounded-xl border bg-white p-5 shadow-sm"><h3 className="font-semibold">Label Activity History</h3><p className="mt-1 text-sm text-gray-500">Recent creates, edits, ordering, assignments, merges, and archives.</p><div className="mt-3 max-h-80 divide-y overflow-y-auto">{activity.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">No label changes recorded yet.</p> : activity.map((entry) => <div key={entry._id} className="py-3 text-sm"><p><span className="font-medium">{entry.actorSnapshot?.name || "Former account"}</span> <span className="text-gray-600">{entry.action.replaceAll("_", " ")} · {entry.resource.replace("InventoryLabel", "label ").trim()}</span></p><p className="mt-1 text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString()}</p></div>)}</div></section>

    {editing && <Modal title={editing === "new" ? "Add Inventory Label" : "Edit Inventory Label"} onClose={() => setEditing(null)} closeDisabled={busy}><form onSubmit={save} className="space-y-3"><label className="block text-sm">Label name<input required disabled={editing !== "new" && editing.isSystem} maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input mt-1 disabled:bg-gray-100" /></label>{editing !== "new" && editing.isSystem && <p className="text-xs text-gray-500">The name of a standard label is protected, but its description and color can be changed.</p>}<label className="block text-sm">Description<textarea maxLength={300} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input mt-1" /></label><label className="flex items-center gap-3 text-sm">Color<input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="h-10 w-16" /></label><button disabled={busy} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">{busy ? "Saving..." : "Save Label"}</button></form></Modal>}
    {mergeSource && <Modal title={`Merge ${mergeSource.name}`} onClose={() => setMergeSource(null)} closeDisabled={busy}><div className="space-y-3"><p className="text-sm text-gray-600">All {mergeSource.itemCount} item(s) will move to the target label. The source label will then be archived.</p><select value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)} className="input"><option value="">Select target label...</option>{labels.filter((label) => label._id !== mergeSource._id).map((label) => <option key={label._id} value={label._id}>{label.name}</option>)}</select><button type="button" disabled={!mergeTargetId || busy} onClick={() => void merge()} className="w-full rounded-lg bg-amber-600 px-4 py-2 font-medium text-white disabled:opacity-50">Merge Labels</button></div></Modal>}
  </div>;

  return embedded ? content : <Layout>{content}</Layout>;
}
