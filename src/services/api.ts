// Base API utility - attaches auth token and handles responses centrally.
const BASE = "/api";

const getHeaders = (isJson = true): HeadersInit => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};

  if (isJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return headers;
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export const api = {
  get: (path: string) =>
    fetch(`${BASE}${path}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  post: (path: string, body: unknown) =>
    fetch(`${BASE}${path}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  put: (path: string, body: unknown) =>
    fetch(`${BASE}${path}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then(handleResponse),

  delete: (path: string) =>
    fetch(`${BASE}${path}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then(handleResponse),

  download: (path: string) =>
    fetch(`${BASE}${path}`, {
      headers: getHeaders(false),
    }),
};