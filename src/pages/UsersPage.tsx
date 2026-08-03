import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import AdminSectionTabs from "../components/AdminSectionTabs";
import PatientsPage from "./PatientsPage";
import { PatientsIcon, StaffIcon, VisitsIcon } from "../components/icons";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useFormErrors } from "../hooks/useFormErrors";
import { useToast } from "../hooks/useToast";
import { FieldError, UnmatchedFieldErrors } from "../components/FieldError";
import type { Patient, User } from "../utils/types";
import type { ReactNode } from "react";

type ManagementView = "students" | "all" | "doctor" | "staff";

const ROLES = ["admin", "doctor", "nurse", "staff"] as const;
const FORM_FIELDS = ["name", "email", "password", "role"];
const emptyForm = { name: "", email: "", password: "", role: "staff" };

function PageFrame({ embedded, children }: { embedded: boolean; children: ReactNode }) {
  return embedded ? <>{children}</> : <Layout>{children}</Layout>;
}

function UsersPage({ embedded = false }: { embedded?: boolean }) {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const {
    formError,
    fieldErrors,
    applyError,
    reset: resetFormErrors,
    clearField,
    unmatchedFieldErrors,
  } = useFormErrors();

  const fetchManagementData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersResponse, studentsResponse] = await Promise.all([
        api.get<User[]>("/users?limit=200"),
        api.get<Patient[]>("/patients?limit=1"),
      ]);
      setUsers(usersResponse.data);
      setStudentCount(studentsResponse.pagination?.total ?? studentsResponse.data.length);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<User[]>("/users?limit=200"),
      api.get<Patient[]>("/patients?limit=1"),
    ])
      .then(([usersResponse, studentsResponse]) => {
        if (cancelled) return;
        setUsers(usersResponse.data);
        setStudentCount(studentsResponse.pagination?.total ?? studentsResponse.data.length);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Failed to load management data");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const doctors = users.filter((user) => user.role === "doctor");
  const staffMembers = users.filter((user) => user.role === "nurse" || user.role === "staff");
  const requestedManagementView = searchParams.get("management");
  const managementView: ManagementView =
    requestedManagementView === "students" ||
    requestedManagementView === "doctor" ||
    requestedManagementView === "staff"
      ? requestedManagementView
      : "all";
  const clinicTeam = users;
  const filteredUsers = useMemo(() => {
    if (managementView === "doctor") return doctors;
    if (managementView === "staff") return staffMembers;
    return clinicTeam;
  }, [clinicTeam, doctors, staffMembers, managementView]);

  const selectManagementView = (view: ManagementView) => {
    const next = new URLSearchParams(searchParams);
    if (view === "all") next.delete("management");
    else next.set("management", view);
    if (view !== "students") next.delete("search");
    setSearchParams(next);
  };

  const openCreate = (role: typeof emptyForm.role = "staff") => {
    setEditTarget(null);
    setForm({ ...emptyForm, role });
    resetFormErrors();
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditTarget(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    resetFormErrors();
    setShowModal(true);
  };

  const setField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    clearField(key);
  };

  const saveUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    resetFormErrors();
    const payload: Record<string, string> = {
      name: form.name,
      email: form.email,
      role: form.role,
    };
    if (form.password) payload.password = form.password;

    try {
      if (!editTarget && !form.password) {
        applyError(new Error("Password is required for new users."));
        return;
      }
      const response = editTarget
        ? await api.put(`/users/${editTarget._id}`, payload)
        : await api.post("/users", payload);
      showToast(response.message);
      setShowModal(false);
      await fetchManagementData();
    } catch (requestError: unknown) {
      applyError(requestError, "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const deactivateUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await api.delete(`/users/${deleteTarget._id}`);
      showToast(response.message);
      setDeleteTarget(null);
      await fetchManagementData();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete account");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const reactivateUser = async (user: User) => {
    setError("");
    try {
      const response = await api.put(`/users/${user._id}`, { isActive: true });
      showToast(response.message);
      await fetchManagementData();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to reactivate account");
    }
  };

  return (
    <PageFrame embedded={embedded}>
      <div className="mx-auto max-w-[1600px] space-y-5">
        {!embedded && <AdminSectionTabs active="management" />}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">Students and clinic accounts</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">Management</h2>
          </div>
          {managementView !== "students" && (
            <button
              type="button"
              onClick={() => openCreate(managementView === "doctor" ? "doctor" : "staff")}
              className="self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:self-auto"
            >
              + Add {managementView === "doctor" ? "Doctor" : managementView === "staff" ? "Nurse / Staff" : "Clinic User"}
            </button>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ManagementCard
            label="Students"
            value={studentCount}
            icon={<PatientsIcon />}
            selected={managementView === "students"}
            action={
              <button
                type="button"
                onClick={() => selectManagementView("students")}
                className="management-card-action"
                aria-pressed={managementView === "students"}
              >
                Manage Students
              </button>
            }
          />
          <ManagementCard
            label="Doctors"
            value={doctors.length}
            icon={<VisitsIcon />}
            selected={managementView === "doctor"}
            action={
              <button
                type="button"
                onClick={() => selectManagementView("doctor")}
                className="management-card-action"
                aria-pressed={managementView === "doctor"}
              >
                Manage Doctors
              </button>
            }
          />
          <ManagementCard
            label="Nurses and Staff"
            value={staffMembers.length}
            icon={<StaffIcon />}
            selected={managementView === "staff"}
            action={
              <button
                type="button"
                onClick={() => selectManagementView("staff")}
                className="management-card-action"
                aria-pressed={managementView === "staff"}
              >
                Manage Staff
              </button>
            }
          />
        </section>

        {managementView === "students" ? (
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <PatientsPage embedded />
          </section>
        ) : (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {managementView === "doctor" ? "Doctors" : managementView === "staff" ? "Nurses and Staff" : "Clinic Team"}
              </h3>
              <p className="mt-1 text-xs text-gray-500">Manage access, roles, and availability.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {([
                ["all", "All"],
                ["doctor", "Doctors"],
                ["staff", "Nurses & Staff"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectManagementView(id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                    managementView === id
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
          ) : filteredUsers.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-500">No clinic users found.</p>
          ) : (
            <>
              <div className="divide-y divide-gray-100 md:hidden">
                {filteredUsers.map((user) => (
                  <article key={user._id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <RoleBadge role={user.role} />
                        <AccessBadge active={user.isActive} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <AvailabilityBadge available={user.isAvailable !== false} />
                      <UserActions
                        user={user}
                        currentUserId={currentUser?.id}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                        onReactivate={reactivateUser}
                      />
                    </div>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Access</th>
                      <th className="px-5 py-3">Availability</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-gray-900">{user.name}</td>
                        <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
                        <td className="px-5 py-4 text-gray-600">{user.email}</td>
                        <td className="px-5 py-4"><AccessBadge active={user.isActive} /></td>
                        <td className="px-5 py-4"><AvailabilityBadge available={user.isAvailable !== false} /></td>
                        <td className="px-5 py-4">
                          <UserActions
                            user={user}
                            currentUserId={currentUser?.id}
                            onEdit={openEdit}
                            onDelete={setDeleteTarget}
                            onReactivate={reactivateUser}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
        )}
      </div>

      {showModal && (
        <Modal title={editTarget ? "Edit Clinic User" : "Add Clinic User"} onClose={() => setShowModal(false)} closeDisabled={saving}>
          {formError && <p className="mb-3 text-sm text-red-500">{formError}</p>}
          <UnmatchedFieldErrors errors={unmatchedFieldErrors(FORM_FIELDS)} />
          <form onSubmit={saveUser} className="space-y-3">
            <UserField label="Name *" error={fieldErrors.name}>
              <input value={form.name} onChange={(event) => setField("name", event.target.value)} required className={`input ${fieldErrors.name ? "input-error" : ""}`} />
            </UserField>
            <UserField label="Email *" error={fieldErrors.email}>
              <input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} required className={`input ${fieldErrors.email ? "input-error" : ""}`} />
            </UserField>
            <UserField label={`Password ${editTarget ? "(leave blank to keep current)" : "*"}`} error={fieldErrors.password}>
              <input type="password" value={form.password} onChange={(event) => setField("password", event.target.value)} required={!editTarget} autoComplete="new-password" className={`input ${fieldErrors.password ? "input-error" : ""}`} />
            </UserField>
            <UserField label="Role *" error={fieldErrors.role}>
              <select value={form.role} onChange={(event) => setField("role", event.target.value)} className={`input ${fieldErrors.role ? "input-error" : ""}`}>
                {ROLES.map((role) => <option key={role} value={role}>{role[0].toUpperCase() + role.slice(1)}</option>)}
              </select>
            </UserField>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Deactivate clinic user"
          message={<>Deactivate <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? Their sessions will be revoked immediately, while their history and audit ownership are preserved.</>}
          confirmLabel="Deactivate"
          busy={deleting}
          onConfirm={deactivateUser}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </PageFrame>
  );
}

function ManagementCard({ label, value, icon, action, selected = false }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  action: React.ReactNode;
  selected?: boolean;
}) {
  return (
    <article className={`rounded-xl border bg-white p-5 shadow-sm transition ${
      selected ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-gray-900">{label}</p>
        <span className="text-gray-800">{icon}</span>
      </div>
      <p className="mt-7 text-3xl font-bold text-gray-900">{value}</p>
      <div className="mt-5">{action}</div>
    </article>
  );
}

function RoleBadge({ role }: { role: User["role"] }) {
  const colors = {
    admin: "bg-purple-100 text-purple-700",
    doctor: "bg-blue-100 text-blue-700",
    nurse: "bg-emerald-100 text-emerald-700",
    staff: "bg-gray-100 text-gray-700",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${colors[role]}`}>{role}</span>;
}

function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${available ? "bg-slate-950 text-white" : "bg-gray-100 text-gray-500"}`}>
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

function AccessBadge({ active }: { active: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
      active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
    }`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UserActions({ user, currentUserId, onEdit, onDelete, onReactivate }: {
  user: User;
  currentUserId?: string;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onReactivate: (user: User) => void;
}) {
  return (
    <div className="flex items-center gap-3 text-xs font-medium">
      <button type="button" onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-800">Edit</button>
      {!user.isActive ? (
        <button type="button" onClick={() => onReactivate(user)} className="text-emerald-600 hover:text-emerald-800">
          Reactivate
        </button>
      ) : currentUserId === user._id ? (
        <span className="cursor-not-allowed text-gray-300" title="You cannot deactivate your own account">Deactivate</span>
      ) : (
        <button type="button" onClick={() => onDelete(user)} className="text-red-500 hover:text-red-700">Deactivate</button>
      )}
    </div>
  );
}

function UserField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-gray-600">
      {label}
      <div className="mt-1">{children}</div>
      <FieldError message={error} />
    </label>
  );
}

export default UsersPage;
