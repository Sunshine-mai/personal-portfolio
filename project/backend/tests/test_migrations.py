from pathlib import Path
import sqlite3

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text


ROOT = Path(__file__).parents[1]


def migration_config(database_url: str) -> Config:
    config = Config(str(ROOT / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", database_url)
    return config

def run_upgrade(database_url: str) -> None:
    command.upgrade(migration_config(database_url), "head")


def test_fresh_database_reaches_head(tmp_path: Path) -> None:
    url = f"sqlite:///{tmp_path / 'fresh.db'}"
    run_upgrade(url)
    engine = create_engine(url)
    names = set(inspect(engine).get_table_names())
    assert {"projects", "revisions", "admin_users", "audit_events", "alembic_version"} <= names


def test_legacy_database_preserves_data_and_adds_compatibility(tmp_path: Path) -> None:
    db_path = tmp_path / "legacy.db"
    connection = sqlite3.connect(db_path)
    connection.executescript(
        """
        CREATE TABLE projects (id INTEGER PRIMARY KEY, slug VARCHAR(120) NOT NULL UNIQUE,
          title VARCHAR(200) NOT NULL, summary TEXT NOT NULL, background TEXT NOT NULL,
          outcome TEXT NOT NULL, role VARCHAR(200) NOT NULL, project_type VARCHAR(30) NOT NULL,
          status VARCHAR(30) NOT NULL, published BOOLEAN NOT NULL, created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL);
        INSERT INTO projects VALUES (7, 'legacy', 'Legacy', 'kept', '', '', '', 'independent', 'DRAFT', 0, '2026-01-01', '2026-01-01');
        CREATE TABLE revisions (id INTEGER PRIMARY KEY, project_id INTEGER NOT NULL, number INTEGER NOT NULL,
          snapshot TEXT NOT NULL, change_summary VARCHAR(500) NOT NULL, status VARCHAR(30) NOT NULL, created_at DATETIME NOT NULL);
        CREATE TABLE admin_users (id INTEGER PRIMARY KEY, username VARCHAR(100) NOT NULL UNIQUE, password_hash VARCHAR(200) NOT NULL);
        """
    )
    connection.commit()
    connection.close()

    url = f"sqlite:///{db_path}"
    command.stamp(migration_config(url), "0001_baseline")
    run_upgrade(url)
    engine = create_engine(f"sqlite:///{db_path}")
    with engine.connect() as conn:
        assert conn.execute(text("SELECT title FROM projects WHERE id = 7")).scalar_one() == "Legacy"
        assert conn.execute(text("SELECT version_num FROM alembic_version")).scalar_one() == "0002_legacy_compat"
    assert "audit_events" in inspect(engine).get_table_names()
