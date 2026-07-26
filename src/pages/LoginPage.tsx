import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../services/api";
import { useFormErrors } from "../hooks/useFormErrors";
import { FieldError } from "../components/FieldError";

// LoginPage handles user authentication and token storage.
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { formError, fieldErrors, applyError, reset: resetFormErrors, clearField } = useFormErrors();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetFormErrors();

    try {
      const data = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }).then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new ApiError(json.message || "Login failed", res.status, json.errors);
        return json;
      });

      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err: unknown) {
      applyError(err, "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_30px_80px_-20px_rgba(37,99,235,0.35)] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 p-8 text-white lg:p-10">
          <div className="inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-50">
            School Clinic
          </div>
          <h1 className="mt-6 text-3xl font-semibold">Welcome back</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-blue-50/90">
            Manage patient care, medicine stock, and daily clinic operations in one secure workspace.
          </p>
          <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <p className="text-sm font-semibold">Secure access</p>
            <p className="mt-2 text-sm text-blue-50/80">Role-based controls and protected routes keep clinic data safe.</p>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-semibold text-slate-800">Clinic Login</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in to continue to your dashboard.</p>
          </div>

          {formError && <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearField("email");
                }}
                className={`input ${fieldErrors.email ? "input-error" : ""}`}
                required
              />
              <FieldError message={fieldErrors.email} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearField("password");
                }}
                className={`input ${fieldErrors.password ? "input-error" : ""}`}
                required
              />
              <FieldError message={fieldErrors.password} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:from-blue-700 hover:to-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;