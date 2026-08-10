import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { api } from "../services/api";
import type { User } from "../utils/types";
import { useToast } from "../hooks/useToast";
import { clearCurrentSession } from "../utils/auth";
import { useNavigate } from "react-router-dom";

function ProfilePage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<User>("/users/me").then((response) => {
      setUser(response.data);
      setForm({ name: response.data.name, email: response.data.email, currentPassword: "", newPassword: "" });
    }).catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Failed to load profile"));
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.put<{ user: User; sessionRevoked: boolean }>("/users/me", {
        name: form.name,
        email: form.email,
        currentPassword: form.currentPassword,
        ...(form.newPassword ? { newPassword: form.newPassword } : {}),
      });
      setUser(response.data.user);
      setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
      showToast(response.message);
      if (response.data.sessionRevoked) {
        clearCurrentSession();
        navigate("/login?reason=password-changed", { replace: true });
      }
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return <Layout><div className="mx-auto max-w-2xl space-y-5"><div><p className="text-sm text-gray-500">Account</p><h1 className="mt-1 text-2xl font-bold text-gray-900">Profile</h1></div><form onSubmit={save} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">{error && <p className="text-sm text-red-600">{error}</p>}<label className="block text-sm font-medium text-gray-700">Name<input className="input mt-2" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="block text-sm font-medium text-gray-700">Email<input className="input mt-2" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="block text-sm font-medium text-gray-700">Current password<input className="input mt-2" type="password" required autoComplete="current-password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></label><label className="block text-sm font-medium text-gray-700">New password <span className="font-normal text-gray-400">(leave blank to keep current)</span><input className="input mt-2" type="password" minLength={12} autoComplete="new-password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></label><p className="text-xs text-gray-500">Changing your password revokes all active sessions and requires you to sign in again.</p><button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50" disabled={saving || !user}>{saving ? "Saving..." : "Save Profile"}</button></form></div></Layout>;
}

export default ProfilePage;
