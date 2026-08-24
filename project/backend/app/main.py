"""FastAPI application entry point for the portfolio platform."""

from fastapi import FastAPI

from app.config import get_settings
from app.api import public, admin
from app.db import Base

settings = get_settings()
app = FastAPI(
    title="Personal Portfolio Platform",
    description="稳定的个人项目、知识和交付记录平台",
    version="0.1.0",
)
app.include_router(public)
app.include_router(admin)


@app.get("/api/health", tags=["system"])
def health_check() -> dict[str, object]:
    """Return a small health response without touching protected content."""
    return {
        "code": 200,
        "message": "healthy",
        "data": {"app": settings.app_name, "environment": settings.app_env},
    }
