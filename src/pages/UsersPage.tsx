import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useFormErrors } from "../hooks/useFormErrors";
import { useToast } from "../components/Toast";
import { FieldError, UnmatchedFieldErrors } from "../components/FieldError";
import type { User } from "../utils/types";

const ROLES = ["admin", "doctor", "nurse", "staff"];
const FORM_FIELDS = ["name", "email", "password", "role"];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "staff",
};

function UsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { formError, fieldErrors, applyError, reset: resetFormErrors, clearField, unmatchedFieldErrors } =
    useFormErrors();

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    resetFormErrors();
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditTarget(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    resetFormErrors();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    resetFormErrors();
    const body: Record<string, string> = {
      name: form.name,
      email: form.email,
      role: form.role,
    };
    if (form.password) body.password = form.password;
    try {
      if (editTarget) {
        const res = await api.put(`/users/${editTarget._id}`, body);
        showToast(res.message);
      } else {
        if (!form.password) {
          applyError(new Error("Password is required for new users."));
          setSaving(false);
          return;
        }
        const res = await api.post("/users", body);
        showToast(res.message);
      }
      setShowModal(false);
      fetchUsers();
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/users/${deleteTarget._id}`);
      showToast(res.message);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const roleColor: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    doctor: "bg-blue-100 text-blue-700",
    nurse: "bg-green-100 text-green-700",
    staff: "bg-gray-100 text-gray-600",
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Users</h2>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add User
        </button>
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
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          roleColor[u.role] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-gray-500 hover:underline text-xs mr-3"
                      >
                        Edit
                      </button>
                      {currentUser?.id === u._id ? (
                        <span
                          className="text-gray-300 text-xs cursor-not-allowed"
                          title="You can't delete your own account"
                        >
                          Delete
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="text-red-500 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title={editTarget ? "Edit User" : "Add User"} onClose={() => setShowModal(false)}>
            {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
            <UnmatchedFieldErrors errors={unmatchedFieldErrors(FORM_FIELDS)} />
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                  className={`input w-full ${fieldErrors.name ? "input-error" : ""}`}
                />
                <FieldError message={fieldErrors.name} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  required
                  className={`input w-full ${fieldErrors.email ? "input-error" : ""}`}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Password {editTarget ? "(leave blank to keep current)" : "*"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  className={`input w-full ${fieldErrors.password ? "input-error" : ""}`}
                  autoComplete="new-password"
                />
                <FieldError message={fieldErrors.password} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setField("role", e.target.value)}
                  className={`input w-full ${fieldErrors.role ? "input-error" : ""}`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <FieldError message={fieldErrors.role} />
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
        <ConfirmDialog
          title="Delete user"
          message={
            <>
              Delete <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? They'll immediately
              lose access to the system. This can't be undone.
            </>
          }
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Layout>
  );
}

export default UsersPage;