"""Public and administrative portfolio APIs."""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.config import get_settings
from app.db import get_db
from app.models import AdminUser, Project, Revision
from app.schemas import LoginRequest, ProjectCreate, ProjectOut, RevisionOut
from app.security import create_token, require_admin

public = APIRouter(prefix="/api/public", tags=["public"])
admin = APIRouter(prefix="/api/admin", tags=["admin"])

def project_data(p: Project, revision_id: int | None = None) -> dict:
    return {"id": p.id, "slug": p.slug, "title": p.title, "summary": p.summary, "background": p.background, "outcome": p.outcome, "role": p.role, "project_type": p.project_type, "status": p.status, "published": p.published, "revision_id": revision_id}

@public.get("/projects")
def list_projects(db: Session = Depends(get_db)) -> dict:
    projects = db.scalars(select(Project).where(Project.published.is_(True)).order_by(Project.updated_at.desc())).all()
    return {"code": 200, "message": "success", "data": [project_data(p) for p in projects]}

@public.get("/projects/{slug}")
def get_project(slug: str, db: Session = Depends(get_db)) -> dict:
    p = db.scalar(select(Project).where(Project.slug == slug, Project.published.is_(True)))
    if not p: raise HTTPException(404, "RESOURCE_NOT_FOUND")
    revision = db.scalar(select(Revision).where(Revision.project_id == p.id, Revision.status == "PUBLISHED").order_by(Revision.number.desc()))
    return {"code": 200, "message": "success", "data": project_data(p, revision.id if revision else None)}

@public.get("/knowledge/nodes")
def knowledge_nodes() -> dict:
    return {"code": 200, "message": "success", "data": [{"id": "fastapi", "label": "FastAPI", "category": "backend"}, {"id": "vue", "label": "Vue 3", "category": "frontend"}, {"id": "sqlite", "label": "SQLite", "category": "database"}]}

@public.get("/learning-summaries")
def learning_summaries() -> dict:
    return {"code": 200, "message": "success", "data": [{"title": "从功能实现到可追溯交付", "summary": "通过修订、审核和发布快照，建立稳定的工程复盘闭环。"}]}

@admin.post("/auth/login")
def login(payload: LoginRequest) -> dict:
    settings = get_settings()
    if payload.username != settings.admin_username or payload.password != settings.admin_password:
        raise HTTPException(401, "AUTHENTICATION_REQUIRED")
    return {"code": 200, "message": "success", "data": {"access_token": create_token(payload.username), "token_type": "bearer"}}

@admin.get("/projects")
def admin_projects(_: str = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    return {"code": 200, "message": "success", "data": [project_data(p) for p in db.scalars(select(Project)).all()]}

@admin.post("/projects")
def create_project(payload: ProjectCreate, _: str = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    if db.scalar(select(Project).where(Project.slug == payload.slug)):
        raise HTTPException(409, "REVISION_CONFLICT")
    p = Project(**payload.model_dump())
    db.add(p); db.flush()
    revision = Revision(project_id=p.id, number=1, snapshot=json.dumps(payload.model_dump(), ensure_ascii=False), change_summary="初始版本")
    db.add(revision); db.commit(); db.refresh(p)
    return {"code": 200, "message": "success", "data": project_data(p, revision.id)}

@admin.post("/projects/{project_id}/submit-review")
def submit_review(project_id: int, _: str = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    p = db.get(Project, project_id)
    if not p: raise HTTPException(404, "RESOURCE_NOT_FOUND")
    revision = db.scalar(select(Revision).where(Revision.project_id == p.id).order_by(Revision.number.desc()))
    if not revision: raise HTTPException(409, "REVISION_CONFLICT")
    revision.status = "IN_REVIEW"; p.status = "IN_REVIEW"; db.commit()
    return {"code": 200, "message": "success", "data": {"revision_id": revision.id, "status": revision.status}}

@admin.post("/revisions/{revision_id}/approve")
def approve(revision_id: int, _: str = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    revision = db.get(Revision, revision_id)
    if not revision: raise HTTPException(404, "RESOURCE_NOT_FOUND")
    if revision.status != "IN_REVIEW": raise HTTPException(409, "INVALID_STATE_TRANSITION")
    revision.status = "APPROVED"; revision.project.status = "APPROVED"; db.commit()
    return {"code": 200, "message": "success", "data": RevisionOut.model_validate(revision).model_dump()}

@admin.post("/revisions/{revision_id}/publish")
def publish(revision_id: int, _: str = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    revision = db.get(Revision, revision_id)
    if not revision: raise HTTPException(404, "RESOURCE_NOT_FOUND")
    if revision.status != "APPROVED": raise HTTPException(409, "REVIEW_REQUIRED")
    revision.status = "PUBLISHED"; revision.project.published = True; revision.project.status = "PUBLISHED"; db.commit()
    return {"code": 200, "message": "success", "data": {"project_id": revision.project_id, "revision_id": revision.id, "status": revision.status}}
