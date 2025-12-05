import os
import logging

SENTRY_DSN = os.getenv("SENTRY_DSN")
try:
    if SENTRY_DSN:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration

        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[FastApiIntegration()],
            traces_sample_rate=0.1,
            send_default_pii=False,
        )
        logging.getLogger("taskup").info("Sentry initialized")
except Exception as e:  # pragma: no cover - sentry optional
    logging.getLogger("taskup").warning(f"Sentry init failed: {e}")
