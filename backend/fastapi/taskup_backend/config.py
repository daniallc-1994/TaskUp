import os
from functools import lru_cache
from pydantic import BaseSettings, AnyHttpUrl
from typing import List


class Settings(BaseSettings):
    app_name: str = "TaskUp Backend"
    api_prefix: str = "/api"
    cors_allow_origins: List[AnyHttpUrl | str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://taskup.no",
        "https://www.taskup.no",
        "https://taskup-frontend.vercel.app",
    ]
    cors_allow_origin_regex: str | None = r"https://.*taskup-frontend.*\.vercel\.app"
    stripe_secret_key: str | None = os.getenv("STRIPE_SECRET_KEY")
    stripe_webhook_secret: str | None = os.getenv("STRIPE_WEBHOOK_SECRET")
    supabase_url: str | None = os.getenv("SUPABASE_URL")
    supabase_service_role_key: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    database_url: str | None = os.getenv("DATABASE_URL")
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret-change-me")
    sentry_dsn: str | None = os.getenv("SENTRY_DSN")

    class Config:
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
