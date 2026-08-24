"""baseline portfolio schema with audit events"""
from alembic import op
import sqlalchemy as sa

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table("projects", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("slug", sa.String(120), nullable=False), sa.Column("title", sa.String(200), nullable=False), sa.Column("summary", sa.Text(), nullable=False), sa.Column("background", sa.Text(), nullable=False), sa.Column("outcome", sa.Text(), nullable=False), sa.Column("role", sa.String(200), nullable=False), sa.Column("project_type", sa.String(30), nullable=False), sa.Column("status", sa.String(30), nullable=False), sa.Column("published", sa.Boolean(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_projects_slug", "projects", ["slug"], unique=True)
    op.create_table("revisions", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id"), nullable=False), sa.Column("number", sa.Integer(), nullable=False), sa.Column("snapshot", sa.Text(), nullable=False), sa.Column("change_summary", sa.String(500), nullable=False), sa.Column("status", sa.String(30), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_revisions_project_id", "revisions", ["project_id"])
    op.create_table("admin_users", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("username", sa.String(100), nullable=False), sa.Column("password_hash", sa.String(200), nullable=False), sa.UniqueConstraint("username"))
    op.create_table("audit_events", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("actor", sa.String(100), nullable=False), sa.Column("action", sa.String(80), nullable=False), sa.Column("resource_type", sa.String(80), nullable=False), sa.Column("resource_id", sa.String(80), nullable=True), sa.Column("detail", sa.Text(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_audit_events_action", "audit_events", ["action"])
    op.create_index("ix_audit_events_created_at", "audit_events", ["created_at"])

def downgrade() -> None:
    op.drop_table("admin_users")
    op.drop_index("ix_revisions_project_id", table_name="revisions")
    op.drop_table("revisions")
    op.drop_index("ix_projects_slug", table_name="projects")
    op.drop_table("projects")
