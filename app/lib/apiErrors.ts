const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

export type ApiErrorDetail = {
  code?: string;
  message: string;
  http_status?: number;
  details?: any;
  fields?: Record<string, string | string[]>;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiErrorDetail;
};

const FRIENDLY: Record<string, string> = {
  NETWORK_ERROR: "errors.network",
  UNAUTHORIZED: "errors.unauthorized",
  FORBIDDEN: "errors.forbidden",
  NOT_FOUND: "errors.not_found",
  VALIDATION_ERROR: "errors.validation",
  RATE_LIMIT: "errors.rate_limited",
  INTERNAL_ERROR: "errors.server",
};

function isNetworkIssue(input: any) {
  const code = (input?.code || "").toString().toUpperCase();
  const msg = (input?.message || "").toString().toLowerCase();
  return (
    code === "ECONNABORTED" ||
    code === "ECONNRESET" ||
    code === "ENETUNREACH" ||
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("failed to fetch") ||
    msg.includes("offline") ||
    input?.name === "AbortError"
  );
}

function normalize(raw: any, status?: number): ApiErrorDetail {
  const http_status = raw?.http_status ?? raw?.status ?? status;
  const code =
    raw?.code ||
    raw?.error_code ||
    raw?.type ||
    (http_status ? `HTTP_${http_status}` : undefined) ||
    "INTERNAL_ERROR";
  const message =
    raw?.message ||
    raw?.detail ||
    raw?.description ||
    raw?.error ||
    (typeof raw === "string" ? raw : null) ||
    FALLBACK_MESSAGE;
  const fields =
    (raw?.fields && typeof raw.fields === "object" ? raw.fields : undefined) ||
    (raw?.errors && typeof raw.errors === "object" ? raw.errors : undefined) ||
    (raw?.validation_errors && typeof raw.validation_errors === "object" ? raw.validation_errors : undefined);
  return { code, message, http_status, details: typeof raw === "object" ? raw : undefined, fields };
}

export function parseApiError(input: any): ApiErrorResponse {
  if (isNetworkIssue(input)) {
    return { success: false, error: { code: "NETWORK_ERROR", message: FALLBACK_MESSAGE } };
  }
  const status = input?.status ?? input?.statusCode ?? input?.response?.status;
  const data = input?.response?.data ?? input?.data ?? input?.body ?? (typeof input === "object" ? input : null);
  if (data?.success === false && data.error) {
    return { success: false, error: normalize(data.error, status) };
  }
  if (data?.error) return { success: false, error: normalize(data.error, status) };
  if (data?.message || data?.detail || typeof data === "string") return { success: false, error: normalize(data, status) };
  if (input?.message) return { success: false, error: normalize(input, status) };
  return { success: false, error: { code: "INTERNAL_ERROR", message: FALLBACK_MESSAGE, http_status: status } };
}

export function getUserFriendlyMessage(parsed: ApiErrorResponse | null | undefined, t?: (key: string) => string) {
  if (!parsed) return t?.("errors.unknown") || FALLBACK_MESSAGE;
  const code = parsed.error.code?.toUpperCase?.();
  const http = parsed.error.http_status;
  const fieldKey = parsed.error.fields ? Object.keys(parsed.error.fields)[0] : null;
  if (fieldKey) {
    const v = parsed.error.fields?.[fieldKey];
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") return v[0];
  }
  if (code && FRIENDLY[code]) return t?.(FRIENDLY[code]) || parsed.error.message || FALLBACK_MESSAGE;
  if (http === 401) return t?.("errors.unauthorized") || FALLBACK_MESSAGE;
  if (http === 403) return t?.("errors.forbidden") || FALLBACK_MESSAGE;
  if (http === 404) return t?.("errors.not_found") || FALLBACK_MESSAGE;
  if (http === 429) return t?.("errors.rate_limited") || FALLBACK_MESSAGE;
  if (http && http >= 500) return t?.("errors.server") || FALLBACK_MESSAGE;
  return parsed.error.message || t?.("errors.unknown") || FALLBACK_MESSAGE;
}
