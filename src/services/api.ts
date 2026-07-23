// Base API utility - attaches auth token and handles responses centrally.

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: { field: string; message: string }[];

  constructor(message: string, status: number, errors?: { field: string; message: string }[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export interface ApiSuccess<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// In dev, Vite's server.proxy (vite.config.ts) forwards "/api" to the local
// backend, so the default of "/api" works with no env var needed.
//
// In production, the frontend and backend are deployed as separate services
// on different domains, so there is no proxy — the browser needs the full
// backend URL. Set VITE_API_URL to that backend's base URL (including
// "/api") in the frontend host's environment variables, e.g.:
//   VITE_API_URL=https://clinic-backend.up.railway.app/api
// If VITE_API_URL is not set, this falls back to the relative "/api" path
// (only correct if both services somehow share an origin/proxy).
const BASE = import.meta.env.VITE_API_URL || "/api";

const getHeaders = (isJson = true): HeadersInit => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};

  if (isJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return headers;
};

const handleResponse = async <T>(res: Response): Promise<ApiSuccess<T>> => {
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new ApiError("Session expired", 401);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.message || "Something went wrong", res.status, data.errors);
  }

  return data as ApiSuccess<T>;
};

export const api = {
  get: <T = any>(path: string) =>
    fetch(`${BASE}${path}`, { headers: getHeaders() }).then((res) => handleResponse<T>(res)),

  post: <T = any>(path: string, body: unknown) =>
    fetch(`${BASE}${path}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then((res) => handleResponse<T>(res)),

  put: <T = any>(path: string, body: unknown) =>
    fetch(`${BASE}${path}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then((res) => handleResponse<T>(res)),

  delete: <T = any>(path: string) =>
    fetch(`${BASE}${path}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then((res) => handleResponse<T>(res)),

  download: (path: string) =>
    fetch(`${BASE}${path}`, {
      headers: getHeaders(false),
    }),
};