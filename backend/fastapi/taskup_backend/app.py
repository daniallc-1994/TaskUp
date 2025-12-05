from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import HTTPException
import logging

from .config import get_settings
from .routers import auth, tasks, offers, messages, payments, disputes, admin, health, notifications, notifications_admin, config
from .errors import (
    TaskUpError,
    error_response_from_taskup_error,
    validation_error,
    internal_error,
    correlation_id_from_request,
)
from . import sentry_utils  # noqa: F401

logger = logging.getLogger("taskup")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="0.1.0", docs_url="/api/docs", openapi_url="/api/openapi.json")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_origin_regex=settings.cors_allow_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class CorrelationIdMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            correlation_id_from_request(request)
            response = await call_next(request)
            return response

    app.add_middleware(CorrelationIdMiddleware)

    @app.exception_handler(TaskUpError)
    async def taskup_error_handler(request: Request, exc: TaskUpError):
        cid = correlation_id_from_request(request)
        return error_response_from_taskup_error(exc, cid)

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        cid = correlation_id_from_request(request)
        field_errors = {}
        for err in exc.errors():
            loc = ".".join([str(i) for i in err.get("loc", []) if i != "body"])
            field_errors.setdefault(loc or "body", []).append(err.get("msg"))
        err = validation_error(field_errors)
        return error_response_from_taskup_error(err, cid)

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        cid = correlation_id_from_request(request)
        err = TaskUpError(
            code=f"HTTP_{exc.status_code}",
            message=exc.detail if exc.detail else "HTTP error",
            type="internal",
            http_status=exc.status_code,
        )
        return error_response_from_taskup_error(err, cid)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        cid = correlation_id_from_request(request)
        logger.exception("Unhandled exception", extra={"correlation_id": cid})
        err = internal_error()
        return error_response_from_taskup_error(err, cid)

    @app.middleware("http")
    async def add_correlation_header(request: Request, call_next):
        cid = correlation_id_from_request(request)
        response = await call_next(request)
        response.headers["X-Correlation-Id"] = cid
        logger.info(
            "request",
            extra={
                "correlation_id": cid,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
            },
        )
        return response

    api_prefix = settings.api_prefix
    # Primary API namespace
    app.include_router(health.router, prefix=api_prefix)
    app.include_router(auth.router, prefix=api_prefix)
    app.include_router(tasks.router, prefix=api_prefix)
    app.include_router(offers.router, prefix=api_prefix)
    app.include_router(messages.router, prefix=api_prefix)
    app.include_router(payments.router, prefix=api_prefix)
    app.include_router(disputes.router, prefix=api_prefix)
    app.include_router(admin.router, prefix=api_prefix)
    app.include_router(notifications.router, prefix=api_prefix)
    app.include_router(notifications_admin.router, prefix=api_prefix)
    app.include_router(config.router, prefix=api_prefix)
    # Compatibility (supports /auth/* alongside /api/auth/*)
    app.include_router(auth.router, prefix="/auth")

    @app.get("/docs", include_in_schema=False)
    async def docs_redirect():
        return RedirectResponse(url="/api/docs")

    @app.get("/openapi.json", include_in_schema=False)
    async def openapi_redirect():
        return RedirectResponse(url="/api/openapi.json")

    @app.get("/")
    async def root():
        return {"name": settings.app_name, "status": "ok"}

    return app
