// Base API utility - uses the server-managed HttpOnly session cookie.
import { clearCurrentSession } from "../utils/auth";

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
let redirectingToLogin = false;

const getHeaders = (isJson = true): HeadersInit => {
  const headers: Record<string, string> = {};

  if (isJson) headers["Content-Type"] = "application/json";

  return headers;
};

interface ErrorPayload {
  message?: string;
  errors?: { field: string; message: string }[];
}

const parseJson = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (!text) {
    if (res.ok) {
      throw new ApiError("The server returned an empty response", res.status);
    }
    return null;
  }

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

interface ReadApiResponseOptions {
  treatUnauthorizedAsSessionExpiry?: boolean;
}

export const readApiResponse = async <T>(
  res: Response,
  { treatUnauthorizedAsSessionExpiry = true }: ReadApiResponseOptions = {},
): Promise<ApiSuccess<T>> => {
  if (res.status === 401 && treatUnauthorizedAsSessionExpiry) {
    clearCurrentSession();
    if (!redirectingToLogin && window.location.pathname !== "/login") {
      redirectingToLogin = true;
      window.location.replace("/login?reason=session-expired");
    }
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

const connectionError = (error: unknown): ApiError =>
  error instanceof ApiError
    ? error
    : new ApiError(
        "Cannot connect to the clinic service. Check your connection and try again.",
        503,
      );

const getWithRetry = async <T>(path: string): Promise<ApiSuccess<T>> => {
  const retryDelays = [300, 900];
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      const response = await fetch(`${BASE}${path}`, {
        headers: getHeaders(),
        credentials: "include",
      });
      const proxyUnavailable =
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504 ||
        (import.meta.env.DEV && response.status === 500);

      if (proxyUnavailable && attempt < retryDelays.length) {
        await wait(retryDelays[attempt] ?? 0);
        continue;
      }

      return await readApiResponse<T>(response);
    } catch (error: unknown) {
      lastError = error;
      if (error instanceof ApiError) throw error;
      if (attempt === retryDelays.length) throw connectionError(error);
      await wait(retryDelays[attempt] ?? 0);
    }
  }

  throw connectionError(lastError);
};

const getAllPages = async <T>(path: string): Promise<ApiSuccess<T[]>> => {
  const collected: T[] = [];
  let page = 1;
  let lastResponse: ApiSuccess<T[]>;

  while (true) {
    const [pathname, query = ""] = path.split("?", 2);
    const params = new URLSearchParams(query);
    params.set("page", String(page));
    params.set("limit", "100");
    const response = await getWithRetry<T[]>(`${pathname}?${params.toString()}`);
    collected.push(...response.data);

    const totalPages = response.pagination?.totalPages ?? 1;
    if (page >= totalPages) {
      lastResponse = response;
      break;
    }
    page += 1;
  }

  return {
    ...lastResponse,
    data: collected,
    ...(lastResponse?.pagination
      ? { pagination: { ...lastResponse.pagination, page: 1, limit: collected.length } }
      : {}),
  };
};

const send = async <T>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<ApiSuccess<T>> => {
  try {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers: getHeaders(),
      credentials: "include",
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return await readApiResponse<T>(response);
  } catch (error: unknown) {
    throw connectionError(error);
  }
};

export const api = {
  get: <T = unknown>(path: string) => getWithRetry<T>(path),

  getAll: <T = unknown>(path: string) => getAllPages<T>(path),

  post: <T = unknown>(path: string, body: unknown) => send<T>(path, "POST", body),

  put: <T = unknown>(path: string, body: unknown) => send<T>(path, "PUT", body),

  delete: <T = unknown>(path: string, body?: unknown) => send<T>(path, "DELETE", body),

  download: async (path: string) => {
    const response = await fetch(`${BASE}${path}`, {
      headers: getHeaders(false),
      credentials: "include",
    });
    if (response.status === 401) {
      clearCurrentSession();
      if (!redirectingToLogin && window.location.pathname !== "/login") {
        redirectingToLogin = true;
        window.location.replace("/login?reason=session-expired");
      }
    }
    return response;
  },
};
