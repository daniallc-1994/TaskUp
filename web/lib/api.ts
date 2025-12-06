import { trackError } from "./telemetry";

const isDev = process.env.NODE_ENV === "development";
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  (isDev ? "http://127.0.0.1:8000" : undefined)
);

if (!API_BASE && !isDev) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production");
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request(method: HttpMethod, path: string, body?: any, token?: string) {
  if (!API_BASE) throw new Error("API base not set");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${normalized}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[api:web] ${method} ${url}`, body ?? "");
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  let data: any = null;
  if (isJson) {
    data = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => "");
    data = text ? { message: text } : null;
  }

  if (!res.ok) {
    const payload = data || { status: res.status };
    const context = {
      status: res.status,
      endpoint: normalized,
      method,
      body: payload,
    };
    trackError(payload, { source: "web", ...context });
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(`[api:web] ${method} ${normalized} failed`, context);
    }
    const message =
      typeof payload === "string" ? payload : payload?.detail || payload?.message || JSON.stringify(payload);
    throw { apiError: payload, status: res.status, message: message || "Request failed" };
  }

  return data;
}

export const api = {
  get: (path: string, token?: string) => request("GET", path, undefined, token),
  post: (path: string, body?: any, token?: string) => request("POST", path, body, token),
};
