export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[event][mobile]", name, props);
  }
}

export function trackError(error: unknown, context?: Record<string, unknown>) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error("[error][mobile]", error, context);
  }
}
