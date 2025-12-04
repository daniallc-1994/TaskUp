const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

type HttpMethod = "GET" | "POST";

async function request(method: HttpMethod, path: string, body?: any, token?: string) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json?.detail || json?.message || "Request failed";
    throw new Error(message);
  }
  return json;
}

export const api = {
  get: (path: string, token?: string) => request("GET", path, undefined, token),
  post: (path: string, body?: any, token?: string) => request("POST", path, body, token),
};
