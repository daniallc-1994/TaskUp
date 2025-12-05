from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import auth, tasks, offers, messages, payments, disputes, admin, health


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
