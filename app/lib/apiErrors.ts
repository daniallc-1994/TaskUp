export type TaskUpApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    type?: string;
    http_status?: number;
    field_errors?: Record<string, string[]>;
    details?: Record<string, unknown>;
    correlation_id?: string;
    retryable?: boolean;
    docs_url?: string;
  };
};

export function parseApiError(err: unknown): TaskUpApiError | null {
  if (!err) return null;
  if (typeof err === "object") {
    const e = err as any;
    if (e.success === false && e.error) return e as TaskUpApiError;
    if (e.apiError) return parseApiError(e.apiError);
    if (e.error && typeof e.error.code === "string") {
      return {
        success: false,
        error: {
          code: e.error.code,
          message: e.error.message ?? "Request failed",
          type: e.error.type,
          http_status: e.error.http_status,
          field_errors: e.error.field_errors,
          details: e.error.details,
          correlation_id: e.error.correlation_id,
          retryable: !!e.error.retryable,
          docs_url: e.error.docs_url,
        },
      };
    }
  }
  return null;
}

export function getUserFriendlyMessage(err: TaskUpApiError | null): string {
  if (!err) return "Something went wrong";
  const map: Record<string, string> = {
    AUTH_INVALID_CREDENTIALS: "Invalid email or password",
    AUTH_REQUIRED: "Please sign in to continue",
    RATE_LIMIT_EXCEEDED: "Too many requests. Please wait and try again.",
    TASK_NOT_FOUND: "Task not found",
    OFFER_NOT_FOUND: "Offer not found",
    PAYMENT_NO_PAYOUT_DESTINATION: "Stripe Connect onboarding required for payouts",
  };
  return map[err.error.code] || err.error.message || "Something went wrong";
}
