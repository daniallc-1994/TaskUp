import { trackError } from "./telemetry";

const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
let defaultToken: string | undefined;

export const setAuthToken = (token?: string) => {
  defaultToken = token || undefined;
};

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request(method: HttpMethod, path: string, body?: any, token?: string) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token || defaultToken) headers.Authorization = `Bearer ${token || defaultToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const json = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const payload = json || { status: res.status };
    const message = payload?.detail || payload?.message || JSON.stringify(payload);
    trackError(payload, { source: "mobile", endpoint: path, method, status: res.status });
    throw { apiError: payload, status: res.status, message };
  }
  return json;
}

export const api = {
  get: (path: string, token?: string) => request("GET", path, undefined, token),
  post: (path: string, body?: any, token?: string) => request("POST", path, body, token),
  put: (path: string, body?: any, token?: string) => request("PUT", path, body, token),
  patch: (path: string, body?: any, token?: string) => request("PATCH", path, body, token),
  del: (path: string, token?: string) => request("DELETE", path, undefined, token),
  API_BASE,
};
