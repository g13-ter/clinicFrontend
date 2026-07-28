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

interface ErrorPayload {
  message?: string;
  errors?: { field: string; message: string }[];
}

const parseJson = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      res.ok
        ? "The server returned an invalid response"
        : `The API is temporarily unavailable (${res.status})`,
      res.status,
    );
  }
};

const handleResponse = async <T>(res: Response): Promise<ApiSuccess<T>> => {
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new ApiError("Session expired", 401);
  }

  const data = await parseJson(res);

  if (!res.ok) {
    const errorPayload =
      typeof data === "object" && data !== null ? data as ErrorPayload : {};
    throw new ApiError(
      errorPayload.message || `Request failed (${res.status})`,
      res.status,
      errorPayload.errors,
    );
  }

  return data as ApiSuccess<T>;
};

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const getWithRetry = async <T>(path: string): Promise<ApiSuccess<T>> => {
  const retryDelays = [300, 900];
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      const response = await fetch(`${BASE}${path}`, { headers: getHeaders() });
      const proxyUnavailable =
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504 ||
        (import.meta.env.DEV && response.status === 500);

      if (proxyUnavailable && attempt < retryDelays.length) {
        await wait(retryDelays[attempt] ?? 0);
        continue;
      }

      return await handleResponse<T>(response);
    } catch (error: unknown) {
      lastError = error;
      if (error instanceof ApiError || attempt === retryDelays.length) throw error;
      await wait(retryDelays[attempt] ?? 0);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new ApiError("The API is temporarily unavailable", 503);
};

export const api = {
  get: <T = unknown>(path: string) => getWithRetry<T>(path),

  post: <T = unknown>(path: string, body: unknown) =>
    fetch(`${BASE}${path}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then((res) => handleResponse<T>(res)),

  put: <T = unknown>(path: string, body: unknown) =>
    fetch(`${BASE}${path}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then((res) => handleResponse<T>(res)),

  delete: <T = unknown>(path: string) =>
    fetch(`${BASE}${path}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then((res) => handleResponse<T>(res)),

  download: (path: string) =>
    fetch(`${BASE}${path}`, {
      headers: getHeaders(false),
    }),
};
