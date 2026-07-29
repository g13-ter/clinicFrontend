import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow w-full max-w-sm">
        <p className="text-center text-sm text-gray-500">School Clinic Management</p>
        <h1 className="mb-6 mt-1 text-center text-2xl font-bold">Sign in</h1>

        {searchParams.get("reason") === "session-expired" && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Your session ended. Sign in again to continue.
          </p>
        )}

        {formError && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="block text-sm font-medium text-gray-700">
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearField("email");
              }}
              className={`mt-1 border rounded px-3 py-2 text-sm w-full ${
                fieldErrors.email ? "input-error" : ""
              }`}
              required
            />
            <FieldError message={fieldErrors.email} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearField("password");
              }}
              className={`mt-1 border rounded px-3 py-2 text-sm w-full ${
                fieldErrors.password ? "input-error" : ""
              }`}
              required
            />
            <FieldError message={fieldErrors.password} />
          </label>
          <button
            type="submit"
            disabled={loading || restoring || cooldownSeconds > 0}
            className="bg-blue-600 text-white rounded py-2 text-sm font-medium disabled:opacity-50"
          >
            {restoring
              ? "Checking session..."
              : loading
              ? "Logging in..."
              : cooldownSeconds > 0
                ? `Try again in ${formatCooldown(cooldownSeconds)}`
                : "Login"}
          </button>
        </form>
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
