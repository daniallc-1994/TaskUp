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

const FRIENDLY_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "Network error. Check your connection and try again.",
  UNAUTHORIZED: "Please sign in again to continue.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please double-check the highlighted fields and try again.",
  INTERNAL_ERROR: FALLBACK_MESSAGE,
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

function normalizeErrorObject(raw: any, status?: number): ApiErrorDetail {
  if (!raw) {
    return { code: status ? `HTTP_${status}` : "INTERNAL_ERROR", message: FALLBACK_MESSAGE, http_status: status };
  }

  if (typeof raw === "string") {
    return { code: status ? `HTTP_${status}` : "ERROR", message: raw, http_status: status };
  }

  const http_status = raw.http_status ?? raw.status ?? raw.status_code ?? status;

  const code =
    raw.code ||
    raw.error_code ||
    raw.type ||
    raw.reason ||
    (http_status ? `HTTP_${http_status}` : undefined) ||
    "INTERNAL_ERROR";

  const message =
    (typeof raw.message === "string" && raw.message) ||
    (typeof raw.detail === "string" && raw.detail) ||
    (typeof raw.description === "string" && raw.description) ||
    (typeof raw.error === "string" && raw.error) ||
    (typeof raw.title === "string" && raw.title) ||
    FALLBACK_MESSAGE;

  const fields =
    (raw.fields && typeof raw.fields === "object" ? raw.fields : undefined) ||
    (raw.errors && typeof raw.errors === "object" ? raw.errors : undefined) ||
    (raw.validation_errors && typeof raw.validation_errors === "object" ? raw.validation_errors : undefined);

  return { code, message, http_status, details: typeof raw === "object" ? raw : undefined, fields };
}

function pickFieldMessage(fields?: Record<string, string | string[]>) {
  if (!fields || typeof fields !== "object") return null;
  const firstKey = Object.keys(fields)[0];
  if (!firstKey) return null;
  const value = fields[firstKey];
  if (Array.isArray(value)) {
    const candidate = value.find((v) => typeof v === "string" && v.trim());
    return (candidate || value[0] || null) as string | null;
  }
  if (typeof value === "string") return value;
  return null;
}

export function parseApiError(input: any): ApiErrorResponse {
  const fallback: ApiErrorResponse = { success: false, error: { code: "INTERNAL_ERROR", message: FALLBACK_MESSAGE } };

  try {
    if (input?.apiError) {
      return parseApiError(input.apiError);
    }

    if (isNetworkIssue(input)) {
      return { success: false, error: { code: "NETWORK_ERROR", message: FRIENDLY_MESSAGES.NETWORK_ERROR } };
    }

    const status = input?.status ?? input?.statusCode ?? input?.response?.status ?? input?.http_status;

    const data =
      input?.response?.data ??
      input?.data ??
      input?.body ??
      (typeof input === "object" && !Array.isArray(input) ? input : null);

    if (data?.success === false && data.error) {
      return { success: false, error: normalizeErrorObject(data.error, status) };
    }

    if (data?.error) {
      return { success: false, error: normalizeErrorObject(data.error, status) };
    }

    if (data?.message || data?.detail || data?.description || typeof data === "string") {
      return { success: false, error: normalizeErrorObject(data, status) };
    }

    if (typeof input === "string") {
      return { success: false, error: { code: "ERROR", message: input, http_status: status } };
    }

    if (input?.message) {
      return { success: false, error: normalizeErrorObject(input, status) };
    }

    return fallback;
  } catch (err) {
    console.error("[apiErrors] parseApiError failed", err);
    return fallback;
  }
}

export function getUserFriendlyMessage(parsed?: ApiErrorResponse | null): string {
  if (!parsed) return FALLBACK_MESSAGE;

  const code = parsed.error.code?.toUpperCase?.();
  const status = parsed.error.http_status;

  const fieldMessage = pickFieldMessage(parsed.error.fields);
  if (fieldMessage) return fieldMessage;

  if (code && FRIENDLY_MESSAGES[code]) return FRIENDLY_MESSAGES[code];

  if (status === 401) return FRIENDLY_MESSAGES.UNAUTHORIZED;
  if (status === 403) return FRIENDLY_MESSAGES.FORBIDDEN;
  if (status === 404) return FRIENDLY_MESSAGES.NOT_FOUND;
  if (status && status >= 500) return FRIENDLY_MESSAGES.INTERNAL_ERROR;

  return parsed.error.message || FALLBACK_MESSAGE;
}
