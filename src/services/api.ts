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

const BASE = "/api";

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

  // Some endpoints may legitimately return an empty body (204 or binary downloads).
  // Use text() and only JSON-parse when there is content to avoid "Unexpected end of JSON input".
  const text = await res.text();

  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new ApiError("Invalid JSON response from server", res.status);
    }
  }

  if (!res.ok) {
    const message = data?.message || "Something went wrong";
    throw new ApiError(message, res.status, data?.errors);
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
