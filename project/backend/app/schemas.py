"""Validated API schemas."""
from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=200)

class ProjectCreate(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9-]+$", min_length=2, max_length=120)
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1, max_length=5000)
    background: str = ""
    outcome: str = ""
    role: str = ""
    project_type: str = "independent"

class ProjectOut(ProjectCreate):
    id: int
    status: str
    published: bool
    revision_id: int | None = None
    model_config = {"from_attributes": True}

class RevisionOut(BaseModel):
    id: int
    number: int
    status: str
    change_summary: str
    model_config = {"from_attributes": True}

class AuditEventOut(BaseModel):
    id: int
    actor: str
    action: str
    resource_type: str
    resource_id: str | None
    detail: str
    created_at: str
