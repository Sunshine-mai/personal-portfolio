from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
payload = {"slug": "acceptance-project", "title": "Acceptance", "summary": "Verified", "background": "b", "outcome": "o", "role": "r", "project_type": "independent"}

def login():
    response = client.post("/api/admin/auth/login", json={"username": "admin", "password": "change-me-local-only"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['data']['access_token']}"}

def test_login_success_and_failure():
    assert client.post("/api/admin/auth/login", json={"username": "admin", "password": "change-me-local-only"}).status_code == 200
    assert client.post("/api/admin/auth/login", json={"username": "admin", "password": "wrong"}).status_code == 401

def test_complete_audit_publish_workflow_and_public_filter():
    headers = login()
    assert client.get("/api/admin/projects", headers=headers).status_code == 200
    unique_payload = {**payload, "slug": "acceptance-project-workflow"}
    created = client.post("/api/admin/projects", json=unique_payload, headers=headers)
    assert created.status_code == 200
    project_id = created.json()["data"]["id"]
    revision_id = created.json()["data"]["revision_id"]
    edited = client.put(f"/api/admin/projects/{project_id}", json={**unique_payload, "title": "Edited"}, headers=headers)
    assert edited.status_code == 200
    assert client.post(f"/api/admin/revisions/{revision_id}/approve", headers=headers).status_code == 409
    submitted = client.post(f"/api/admin/projects/{project_id}/submit-review", headers=headers)
    assert submitted.status_code == 200
    revision_id = submitted.json()["data"]["revision_id"]
    assert client.post(f"/api/admin/revisions/{revision_id}/approve", headers=headers).status_code == 200
    assert client.post(f"/api/admin/revisions/{revision_id}/publish", headers=headers).status_code == 200
    public = client.get("/api/public/projects").json()["data"]
    assert any(item["id"] == project_id for item in public)
    assert client.get("/api/admin/audit-events", headers=headers).status_code == 200
    assert client.post(f"/api/admin/projects/{project_id}/unpublish", headers=headers).status_code == 200
    assert not any(item["id"] == project_id for item in client.get("/api/public/projects").json()["data"])

def test_unauthorized_and_invalid_state():
    assert client.post("/api/admin/projects", json={**payload, "slug": "unauthorized-project"}).status_code == 401
    headers = login()
    assert client.post("/api/admin/revisions/999999/approve", headers=headers).status_code == 404
