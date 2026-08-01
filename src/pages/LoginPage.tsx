import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../services/api";
import { useFormErrors } from "../hooks/useFormErrors";
import { FieldError } from "../components/FieldError";
import {
  getCurrentUser,
  restoreCurrentSession,
  saveCurrentSession,
} from "../utils/auth";
import type { UserRole } from "../config/permissions";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: { id: string; role: UserRole };
    expiresAt: string;
  };
}

// LoginPage handles user authentication and token storage.
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { formError, fieldErrors, applyError, reset: resetFormErrors, clearField } = useFormErrors();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (getCurrentUser()) {
      navigate("/dashboard", { replace: true });
      return;
    }
    let cancelled = false;
    restoreCurrentSession().then((result) => {
      if (cancelled) return;
      if (result.status === "authenticated") {
        navigate("/dashboard", { replace: true });
      } else {
        setRestoring(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;
    setLoading(true);
    resetFormErrors();

    try {
      const data = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      }).then(async (res) => {
        const json = await res.json() as LoginResponse & {
          errors?: { field: string; message: string }[];
        };
        if (!res.ok) {
          if (res.status === 429) {
            setCooldownSeconds(parseRetryAfter(res.headers.get("Retry-After")) ?? 120);
          }
          throw new ApiError(json.message || "Login failed", res.status, json.errors);
        }
        return json;
      });

      saveCurrentSession(data.data.user, data.data.expiresAt);
      navigate("/dashboard");
    } catch (err: unknown) {
      applyError(err, "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/70 shadow-2xl shadow-slate-950/50 lg:flex-row">
        <div className="flex-1 bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-950 p-8 sm:p-10 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">Secure access</p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Welcome back to your care workspace.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Sign in to manage patients, appointments, medicines, and reporting from one calm, connected
            platform.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Patient journey visibility",
              "Secure clinical operations",
              "Real-time activity tracking",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-sm font-semibold text-sky-200">
                  ✓
                </span>
                <span className="text-sm text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 border-t border-white/10 bg-slate-950/80 p-8 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Clinic login</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Sign in</h2>
            </div>
            <Link to="/" className="text-sm font-medium text-sky-300 transition hover:text-sky-200">
              Back home
            </Link>
          </div>

          {searchParams.get("reason") === "session-expired" && (
            <p className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-200">
              Your session ended. Sign in again to continue.
            </p>
          )}

          {formError && (
            <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-200">
              {formError}
            </p>
          )}

          <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@clinic.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearField("email");
                }}
                className={`w-full rounded-2xl border bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  fieldErrors.email ? "border-red-400 focus:ring-red-400/30" : "border-slate-700 focus:border-sky-400 focus:ring-sky-500/30"
                }`}
                required
              />
              <FieldError message={fieldErrors.email} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearField("password");
                }}
                className={`w-full rounded-2xl border bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  fieldErrors.password ? "border-red-400 focus:ring-red-400/30" : "border-slate-700 focus:border-sky-400 focus:ring-sky-500/30"
                }`}
                required
              />
              <FieldError message={fieldErrors.password} />
            </div>
            <button
              type="submit"
              disabled={loading || restoring || cooldownSeconds > 0}
              className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {restoring
                ? "Checking session..."
                : loading
                ? "Signing in..."
                : cooldownSeconds > 0
                  ? `Try again in ${formatCooldown(cooldownSeconds)}`
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-400">
            Need access? Contact your clinic administrator to get started.
          </p>
        </div>
      </div>
    </div>
  );
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(1, Math.ceil(seconds));
  const retryDate = new Date(value).getTime();
  return Number.isNaN(retryDate)
    ? null
    : Math.max(1, Math.ceil((retryDate - Date.now()) / 1000));
}

function formatCooldown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default LoginPage;