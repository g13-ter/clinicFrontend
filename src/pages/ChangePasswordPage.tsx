import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import PasswordInput from "../components/PasswordInput";
import { api } from "../services/api";
import { clearCurrentSession } from "../utils/auth";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) return setError("The new passwords do not match.");
    setSaving(true); setError("");
    try {
      await api.put("/users/me", { currentPassword, newPassword });
      clearCurrentSession();
      navigate("/login?reason=password-changed", { replace: true });
    } catch (err) { setError(err instanceof Error ? err.message : "Password change failed"); }
    finally { setSaving(false); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
    <BrandLogo className="h-12 w-12" /><h1 className="mt-5 text-2xl font-bold text-slate-950">Create your private password</h1>
    <p className="mt-2 text-sm leading-6 text-slate-600">Your account was issued a temporary password. Change it before using the clinic system.</p>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <form onSubmit={submit} className="mt-6 space-y-4"><PasswordField id="temporary-password" label="Temporary password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" /><PasswordField id="new-password" label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" minLength={12} /><PasswordField id="confirm-new-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" minLength={12} /><button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Changing password..." : "Change Password"}</button></form>
  </section></main>;
}
function PasswordField({ id, label, value, onChange, autoComplete, minLength }: { id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: string; minLength?: number }) {
  return <div><label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}</label><PasswordInput id={id} required minLength={minLength} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} className="input" containerClassName="mt-1" /></div>;
}
