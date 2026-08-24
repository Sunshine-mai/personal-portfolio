"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    app_name: str = "personal-portfolio"
    secret_key: str
    database_url: str = "sqlite:///./portfolio.db"
    frontend_origin: str = "http://localhost:1001"
    backend_host: str = "127.0.0.1"
    backend_port: int = 2001

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
