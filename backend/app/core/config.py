"""App settings, loaded from environment / .env."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://gary:gary@localhost:5432/gary"
    mongo_url: str = "mongodb://gary:gary@localhost:27017"
    mongo_db: str = "gary"

    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    cors_origins: str = "http://localhost:5173"

    upload_dir: str = "uploads"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
