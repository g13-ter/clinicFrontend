import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageFrame from "../components/PageFrame";
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
import { requiresAdministrativeStepUp } from "../features/admin/superAdminSecurity";

type ManagementView = "students" | "all" | "admin" | "doctor" | "staff";
type AccountStatus = "all" | "active" | "inactive";

const ALL_ROLES: User["role"][] = ["superadmin", "admin", "doctor", "nurse", "staff"];
const CLINIC_ROLES: User["role"][] = ["doctor", "nurse", "staff"];
const FORM_FIELDS = ["name", "email", "password", "role", "actorPassword"];
const emptyForm: { name: string; email: string; password: string; role: User["role"] } = { name: "", email: "", password: "", role: "staff" };

function UsersPage({ embedded = false }: { embedded?: boolean }) {
  const { user: currentUser, role } = useAuth();
  const isSuperAdmin = role === "superadmin";
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus>("all");
  const [roleFilter, setRoleFilter] = useState<User["role"] | "all">("all");
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [stepUpPassword, setStepUpPassword] = useState("");
  const [resetActorPassword, setResetActorPassword] = useState("");
  const [deactivateActorPassword, setDeactivateActorPassword] = useState("");
  const [reactivateTarget, setReactivateTarget] = useState<User | null>(null);
  const [reactivateActorPassword, setReactivateActorPassword] = useState("");
  const [reactivating, setReactivating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
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
      const usersResponse = await api.getAll<User>("/users");
      const studentsResponse = isSuperAdmin ? null : await api.get<Patient[]>("/patients?limit=1");
      setUsers(usersResponse.data);
      setStudentCount(studentsResponse?.pagination?.total ?? studentsResponse?.data.length ?? 0);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.getAll<User>("/users"),
      isSuperAdmin ? Promise.resolve(null) : api.get<Patient[]>("/patients?limit=1"),
    ])
      .then(([usersResponse, studentsResponse]) => {
        if (cancelled) return;
        setUsers(usersResponse.data);
        setStudentCount(studentsResponse?.pagination?.total ?? studentsResponse?.data.length ?? 0);
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
  }, [isSuperAdmin]);

  const administrators = useMemo(
    () => users.filter((user) => user.role === "admin" || user.role === "superadmin"),
    [users],
  );
  const doctors = users.filter((user) => user.role === "doctor");
  const staffMembers = users.filter((user) => user.role === "nurse" || user.role === "staff");
  const requestedManagementView = searchParams.get("management");
  const managementView: ManagementView =
    requestedManagementView === "all" ||
    requestedManagementView === "students" ||
    requestedManagementView === "admin" ||
    requestedManagementView === "doctor" ||
    requestedManagementView === "staff"
      ? requestedManagementView
      : "all";
  const clinicTeam = users;
  const scopedUsers = useMemo(() => {
    if (managementView === "admin") return administrators;
    if (managementView === "doctor") return doctors;
    if (managementView === "staff") return staffMembers;
    return clinicTeam;
  }, [clinicTeam, doctors, staffMembers, administrators, managementView]);
  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return scopedUsers.filter((account) => {
      if (statusFilter === "active" && !account.isActive) return false;
      if (statusFilter === "inactive" && account.isActive) return false;
      if (roleFilter !== "all" && account.role !== roleFilter) return false;
      return !normalizedQuery || account.name.toLowerCase().includes(normalizedQuery) || account.email.toLowerCase().includes(normalizedQuery);
    });
  }, [query, roleFilter, scopedUsers, statusFilter]);

  const selectManagementView = (view: ManagementView) => {
    const next = new URLSearchParams(searchParams);
    next.set("management", view);
    if (view !== "students") next.delete("search");
    setSearchParams(next);
  };

  const openCreate = (selectedRole: User["role"] = "staff") => {
    setEditTarget(null);
    setForm({ ...emptyForm, role: selectedRole });
    resetFormErrors();
    setStepUpPassword("");
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditTarget(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    resetFormErrors();
    setStepUpPassword("");
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
    const requiresStepUp = requiresAdministrativeStepUp(role);
    if (requiresStepUp) payload.actorPassword = stepUpPassword;

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
      const requiresStepUp = requiresAdministrativeStepUp(role);
      const response = await api.delete(
        `/users/${deleteTarget._id}`,
        requiresStepUp ? { actorPassword: deactivateActorPassword } : undefined,
      );
      showToast(response.message);
      setDeleteTarget(null);
      setDeactivateActorPassword("");
      await fetchManagementData();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to deactivate account");
      setDeleteTarget(null);
      setDeactivateActorPassword("");
    } finally {
      setDeleting(false);
    }
  };

  const reactivateUser = async (user: User, actorPassword?: string) => {
    setError("");
    setReactivating(true);
    try {
      const response = await api.put(`/users/${user._id}`, {
        isActive: true,
        ...(actorPassword ? { actorPassword } : {}),
      });
      showToast(response.message);
      setReactivateTarget(null);
      setReactivateActorPassword("");
      await fetchManagementData();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to reactivate account");
    } finally {
      setReactivating(false);
    }
  };

  const requestReactivation = (user: User) => {
    if (requiresAdministrativeStepUp(role)) {
      setReactivateTarget(user);
      setReactivateActorPassword("");
      return;
    }
    void reactivateUser(user);
  };

  const openPasswordReset = (user: User) => {
    setResetTarget(user);
    setResetPassword("");
    setResetError("");
    setResetActorPassword("");
  };

  const submitPasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetTarget) return;
    setResetting(true);
    setResetError("");
    try {
      await api.put(`/users/${resetTarget._id}`, {
        password: resetPassword,
        ...(requiresAdministrativeStepUp(role) ? { actorPassword: resetActorPassword } : {}),
      });
      showToast(`Temporary password set for ${resetTarget.name}. They must change it at their next sign-in.`);
      setResetTarget(null);
    } catch (requestError: unknown) {
      setResetError(requestError instanceof Error ? requestError.message : "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  return (
    <PageFrame embedded={embedded}>
      <div className="mx-auto max-w-[1600px] space-y-5">
        {!embedded && role === "admin" && <AdminSectionTabs active="management" />}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">{isSuperAdmin ? "System accounts and administrative access" : "Patients and clinic accounts"}</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{isSuperAdmin ? "User Management" : "Management"}</h2>
          </div>
          {managementView !== "students" && (
            <button
              type="button"
              onClick={() => openCreate(managementView === "admin" ? "admin" : managementView === "doctor" ? "doctor" : "staff")}
              className="self-start rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:self-auto"
            >
              + Add {managementView === "admin" ? "Administrator" : managementView === "doctor" ? "Doctor" : managementView === "staff" ? "Nurse / Staff" : "User"}
            </button>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {isSuperAdmin ? <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ManagementCard label="All Accounts" value={users.length} icon={<StaffIcon />} selected={managementView === "all"} action={<button type="button" onClick={() => selectManagementView("all")} className="management-card-action">Manage All Users</button>} />
          <ManagementCard label="Administrators" value={administrators.length} icon={<StaffIcon />} selected={managementView === "admin"} action={<button type="button" onClick={() => selectManagementView("admin")} className="management-card-action">Manage Administrators</button>} />
        </section> : <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ManagementCard
            label="Patient Directory"
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
                View / Archive Patients
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
        </section>}

        {!isSuperAdmin && managementView === "students" ? (
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <PatientsPage embedded />
          </section>
        ) : (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {managementView === "admin" ? "Administrators" : managementView === "doctor" ? "Doctors" : managementView === "staff" ? "Nurses and Staff" : isSuperAdmin ? "All Accounts" : "Clinic Team"}
              </h3>
              <p className="mt-1 text-xs text-gray-500">Manage account details, roles, passwords, and access status.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {(isSuperAdmin ? ([
                ["all", "All Users"],
                ["admin", "Administrators"],
                ["doctor", "Doctors"],
                ["staff", "Nurses & Staff"],
              ] as const) : ([ 
                ["all", "All"],
                ["doctor", "Doctors"],
                ["staff", "Nurses & Staff"],
              ] as const)).map(([id, label]) => (
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

          <div className="grid gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email..." className="input bg-white" />
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as User["role"] | "all")} className="input bg-white" aria-label="Filter by role">
              <option value="all">All roles</option>
              {(isSuperAdmin ? ALL_ROLES : CLINIC_ROLES).map((itemRole) => <option key={itemRole} value={itemRole}>{roleLabel(itemRole)}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AccountStatus)} className="input bg-white" aria-label="Filter by account status">
              <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-12 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-500">No accounts match the selected filters.</p>
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
                        <AccountAccess user={user} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <AccountAvailability user={user} />
                      <UserActions
                        user={user}
                        currentUserId={currentUser?.id}
                        onEdit={openEdit}
                        onReset={openPasswordReset}
                        onDelete={setDeleteTarget}
                        onReactivate={requestReactivation}
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
                        <td className="px-5 py-4"><AccountAccess user={user} /></td>
                        <td className="px-5 py-4"><AccountAvailability user={user} /></td>
                        <td className="px-5 py-4">
                          <UserActions
                            user={user}
                            currentUserId={currentUser?.id}
                            onEdit={openEdit}
                            onReset={openPasswordReset}
                            onDelete={setDeleteTarget}
                            onReactivate={requestReactivation}
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
        <Modal title={editTarget ? "Edit Account" : "Add Account"} onClose={() => setShowModal(false)} closeDisabled={saving}>
          {formError && <p className="mb-3 text-sm text-red-500">{formError}</p>}
          <UnmatchedFieldErrors errors={unmatchedFieldErrors(FORM_FIELDS)} />
          <form onSubmit={saveUser} className="space-y-3">
            <UserField label="Name *" error={fieldErrors.name}>
              <input value={form.name} onChange={(event) => setField("name", event.target.value)} required className={`input ${fieldErrors.name ? "input-error" : ""}`} />
            </UserField>
            <UserField label="Email *" error={fieldErrors.email}>
              <input type="email" value={form.email} onChange={(event) => setField("email", event.target.value)} required className={`input ${fieldErrors.email ? "input-error" : ""}`} />
            </UserField>
            {!editTarget && <UserField label="Password *" error={fieldErrors.password}>
              <input type="password" value={form.password} onChange={(event) => setField("password", event.target.value)} required autoComplete="new-password" className={`input ${fieldErrors.password ? "input-error" : ""}`} />
            </UserField>}
            <UserField label="Role *" error={fieldErrors.role}>
              <select value={form.role} onChange={(event) => setField("role", event.target.value)} disabled={editTarget?._id === currentUser?.id && editTarget?.role === "superadmin"} className={`input ${fieldErrors.role ? "input-error" : ""}`}>
                {(isSuperAdmin ? ALL_ROLES : CLINIC_ROLES).map((itemRole) => <option key={itemRole} value={itemRole}>{roleLabel(itemRole)}</option>)}
              </select>
            </UserField>
            {requiresAdministrativeStepUp(role) && (
              <UserField label="Confirm your current password" error={fieldErrors.actorPassword}>
                <input type="password" value={stepUpPassword} onChange={(event) => { setStepUpPassword(event.target.value); clearField("actorPassword"); }} required autoComplete="current-password" className={`input ${fieldErrors.actorPassword ? "input-error" : ""}`} />
              </UserField>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {resetTarget && (
        <Modal title="Reset Account Password" onClose={() => setResetTarget(null)} closeDisabled={resetting}>
          <p className="mb-4 text-sm text-gray-600">Set a new password for <strong>{resetTarget.name}</strong> ({resetTarget.email}). All active sessions for this account will be revoked.</p>
          {resetError && <p className="mb-3 text-sm text-red-600">{resetError}</p>}
          <form onSubmit={submitPasswordReset} className="space-y-4">
            <label className="block text-xs font-medium text-gray-600">New password<input type="password" minLength={12} required autoComplete="new-password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} className="input mt-1" /></label>
            {requiresAdministrativeStepUp(role) && <label className="block text-xs font-medium text-gray-600">Confirm your current password<input type="password" required autoComplete="current-password" value={resetActorPassword} onChange={(event) => setResetActorPassword(event.target.value)} className="input mt-1" /></label>}
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setResetTarget(null)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={resetting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{resetting ? "Resetting..." : "Reset Password"}</button></div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Deactivate Account"
          message={<>Are you sure you want to deactivate <strong>{deleteTarget.name}</strong> ({deleteTarget.email}), currently assigned the <strong>{roleLabel(deleteTarget.role)}</strong> role? The user will no longer be able to log in, but their historical clinic records and audit history will be preserved.</>}
          confirmLabel="Deactivate Account"
          busy={deleting}
          confirmationContent={<label className="mb-5 block text-xs font-medium text-gray-600">Confirm your current password<input type="password" required autoComplete="current-password" value={deactivateActorPassword} onChange={(event) => setDeactivateActorPassword(event.target.value)} className="input mt-1" /></label>}
          confirmDisabled={!deactivateActorPassword}
          onConfirm={deactivateUser}
          onCancel={() => { setDeleteTarget(null); setDeactivateActorPassword(""); }}
        />
      )}
      {reactivateTarget && (
        <ConfirmDialog
          title="Activate Privileged Account"
          message={<>Confirm activation of <strong>{reactivateTarget.name}</strong> ({reactivateTarget.email}) with the <strong>{roleLabel(reactivateTarget.role)}</strong> role.</>}
          confirmLabel="Activate Account"
          danger={false}
          busy={reactivating}
          confirmationContent={<label className="mb-5 block text-xs font-medium text-gray-600">Confirm your current password<input type="password" required autoComplete="current-password" value={reactivateActorPassword} onChange={(event) => setReactivateActorPassword(event.target.value)} className="input mt-1" /></label>}
          confirmDisabled={!reactivateActorPassword}
          onConfirm={() => void reactivateUser(reactivateTarget, reactivateActorPassword)}
          onCancel={() => { setReactivateTarget(null); setReactivateActorPassword(""); }}
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
    superadmin: "bg-slate-900 text-white",
    admin: "bg-purple-100 text-purple-700",
    doctor: "bg-blue-100 text-blue-700",
    nurse: "bg-emerald-100 text-emerald-700",
    staff: "bg-gray-100 text-gray-700",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[role]}`}>{roleLabel(role)}</span>;
}

function roleLabel(role: User["role"]): string {
  return role === "superadmin" ? "Super Admin" : role[0].toUpperCase() + role.slice(1);
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

function AccountAccess({ user }: { user: User }) {
  if (user.isActive) return <div><AccessBadge active />{user.mustChangePassword && <p className="mt-1 text-[11px] font-medium leading-4 text-amber-700">Password change required</p>}</div>;
  const deactivator = typeof user.deactivatedBy === "object" ? user.deactivatedBy.name : "Unknown administrator";
  return <div><AccessBadge active={false} />{user.deactivatedAt && <p className="mt-1 text-[11px] leading-4 text-gray-400">{new Date(user.deactivatedAt).toLocaleDateString()} by {deactivator}</p>}</div>;
}

function AccountAvailability({ user }: { user: User }) {
  if (user.role === "admin" || user.role === "superadmin") return <span className="text-xs text-gray-400">Not applicable</span>;
  return <AvailabilityBadge available={user.isAvailable !== false} />;
}

function UserActions({ user, currentUserId, onEdit, onReset, onDelete, onReactivate }: {
  user: User;
  currentUserId?: string;
  onEdit: (user: User) => void;
  onReset: (user: User) => void;
  onDelete: (user: User) => void;
  onReactivate: (user: User) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
      <button type="button" onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-800">Edit Account</button>
      {currentUserId !== user._id && <button type="button" onClick={() => onReset(user)} className="text-violet-600 hover:text-violet-800">Reset Password</button>}
      {!user.isActive ? (
        <button type="button" onClick={() => onReactivate(user)} className="text-emerald-600 hover:text-emerald-800">
          Activate
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
