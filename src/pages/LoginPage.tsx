import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../services/api";
import { useFormErrors } from "../hooks/useFormErrors";
import { FieldError } from "../components/FieldError";

// LoginPage handles user authentication and token storage.
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { formError, fieldErrors, applyError, reset: resetFormErrors, clearField } = useFormErrors();
  const navigate = useNavigate();

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
        body: JSON.stringify({ email, password }),
      }).then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          if (res.status === 429) {
            setCooldownSeconds(parseRetryAfter(res.headers.get("Retry-After")) ?? 120);
          }
          throw new ApiError(json.message || "Login failed", res.status, json.errors);
        }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Clinic Login</h1>

        {formError && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearField("email");
              }}
              className={`border rounded px-3 py-2 text-sm w-full ${
                fieldErrors.email ? "input-error" : ""
              }`}
              required
            />
            <FieldError message={fieldErrors.email} />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearField("password");
              }}
              className={`border rounded px-3 py-2 text-sm w-full ${
                fieldErrors.password ? "input-error" : ""
              }`}
              required
            />
            <FieldError message={fieldErrors.password} />
          </div>
          <button
            type="submit"
            disabled={loading || cooldownSeconds > 0}
            className="bg-blue-600 text-white rounded py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading
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
