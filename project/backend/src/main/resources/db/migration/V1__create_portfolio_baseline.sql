CREATE TABLE IF NOT EXISTS projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    background TEXT NOT NULL,
    outcome TEXT NOT NULL,
    role VARCHAR(200) NOT NULL,
    project_type VARCHAR(30) NOT NULL DEFAULT 'independent',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS revisions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    number INT NOT NULL,
    snapshot JSON NOT NULL,
    change_summary VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_revisions_project FOREIGN KEY (project_id) REFERENCES projects(id),
    CONSTRAINT uk_revisions_project_number UNIQUE (project_id, number)
);

CREATE TABLE IF NOT EXISTS admin_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id VARCHAR(80),
    detail TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_published_updated ON projects (published, updated_at);
CREATE INDEX idx_revisions_project_status ON revisions (project_id, status);
CREATE INDEX idx_audit_events_created ON audit_events (created_at);
