import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../services/api";
import { useFormErrors } from "../hooks/useFormErrors";
import { FieldError } from "../components/FieldError";
import { BrandLogo } from "../components/BrandLogo";
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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="landing-hero relative min-h-screen overflow-hidden px-5 py-7 sm:px-8 lg:px-12">
      <div className="landing-orb -left-28 top-24 h-80 w-80 bg-blue-400/30" />
      <div className="landing-orb -right-20 bottom-0 h-96 w-96 bg-indigo-300/25" />
      <div className="landing-curve landing-curve-left" />
      <div className="landing-curve landing-curve-right" />
      <div className="landing-circle -left-16 top-[38%] h-36 w-36 opacity-70" />
      <div className="landing-circle right-[8%] top-16 h-24 w-24 opacity-60" />

      <header className="relative z-20 mx-auto flex max-w-[1280px] items-center justify-between">
        <Link to="/" className="flex items-center gap-3" aria-label="Back to SchoolCare home">
          <LoginBrandMark />
          <span className="leading-none">
            <span className="block text-lg font-extrabold tracking-tight text-slate-950">SchoolCare</span>
            <span className="mt-1 block text-[10px] font-medium tracking-wide text-slate-500">Clinic Management System</span>
          </span>
        </Link>
        <Link to="/" className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-xs font-bold text-slate-600 shadow-sm backdrop-blur transition hover:border-blue-200 hover:text-blue-700">
          ← Back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-[1120px] items-center py-12">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(30,64,175,0.18)] lg:grid-cols-[1.02fr_0.98fr]">
          <section className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-12 text-white lg:flex lg:min-h-[650px] lg:flex-col lg:justify-between">
            <div className="landing-crosses absolute inset-0 opacity-20" />
            <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full border border-white/15 bg-white/5" />
            <div className="absolute -bottom-36 -left-20 h-96 w-96 rounded-full border border-white/10 bg-blue-400/10" />
            <div className="absolute bottom-12 right-10 h-24 w-24 rounded-full border border-white/10 bg-white/5" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-blue-100 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Secure clinic workspace
              </span>
              <h2 className="mt-8 max-w-md text-5xl font-black leading-[1.08] tracking-[-0.04em]">
                Better care starts with better information.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-blue-100">
                Access student records, appointments, clinical care, medicine inventory, and reports from one connected system.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-3">
              <LoginFeature value="4" label="Role workspaces" />
              <LoginFeature value="24/7" label="Record access" />
              <LoginFeature value="100%" label="Traceable" />
            </div>
          </section>

          <section className="flex min-h-[600px] items-center bg-white px-6 py-12 sm:px-12 lg:px-14">
            <div className="mx-auto w-full max-w-[420px]">
              <div className="lg:hidden">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Secure clinic access
                </span>
              </div>
              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600 lg:mt-0">Welcome back</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] text-slate-950">Sign in to SchoolCare</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">Enter your authorized clinic account to continue to your workspace.</p>

              <div className="mt-7">
                {searchParams.get("reason") === "session-expired" && (
                  <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <span aria-hidden="true">!</span>
                    <p>Your session ended. Sign in again to continue.</p>
                  </div>
                )}

                {formError && (
                  <div role="alert" className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span aria-hidden="true">!</span>
                    <p>{formError}</p>
                  </div>
                )}

                <form onSubmit={handleLogin} className="grid gap-5">
                  <label className="block text-sm font-bold text-slate-700">
                    Email address
                    <span className="relative mt-2 block">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
                        <EmailIcon />
                      </span>
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          clearField("email");
                        }}
                        placeholder="name@school.edu"
                        className={`h-12 w-full rounded-xl border bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${fieldErrors.email ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}
                        required
                      />
                    </span>
                    <FieldError message={fieldErrors.email} />
                  </label>

                  <label className="block text-sm font-bold text-slate-700">
                    Password
                    <span className="relative mt-2 block">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
                        <LockIcon />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          clearField("password");
                        }}
                        placeholder="Enter your password"
                        className={`h-12 w-full rounded-xl border bg-slate-50 pl-11 pr-14 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${fieldErrors.password ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </span>
                    <FieldError message={fieldErrors.password} />
                  </label>

                  <button
                    type="submit"
                    disabled={loading || restoring || cooldownSeconds > 0}
                    className="mt-1 inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:translate-y-0 disabled:opacity-60"
                  >
                    {restoring
                      ? "Checking session..."
                      : loading
                      ? "Signing in..."
                      : cooldownSeconds > 0
                        ? `Try again in ${formatCooldown(cooldownSeconds)}`
                        : <>Sign in <span aria-hidden="true">→</span></>}
                  </button>
                </form>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400">
                <ShieldIcon />
                Authorized clinic personnel only
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function LoginBrandMark() {
  return <BrandLogo className="h-11 w-11 drop-shadow-[0_7px_10px_rgba(37,99,235,0.22)]" />;
}

function LoginFeature({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-4 text-center backdrop-blur"><p className="text-xl font-black">{value}</p><p className="mt-1 text-[10px] font-medium text-blue-100">{label}</p></div>;
}

function EmailIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
}

function ShieldIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-emerald-500"><path d="M12 3 5 6v5c0 4.5 2.8 7.8 7 10 4.2-2.2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
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
