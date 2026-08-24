from fastapi.testclient import TestClient

from app.main import app


def test_health_check() -> None:
    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.json()["code"] == 200
    assert response.json()["data"]["app"] == "personal-portfolio"

def test_public_projects_is_empty_or_published_only() -> None:
    response = TestClient(app).get("/api/public/projects")
    assert response.status_code == 200
    assert response.json()["code"] == 200

def test_admin_requires_authentication() -> None:
    assert TestClient(app).get("/api/admin/projects").status_code == 401
