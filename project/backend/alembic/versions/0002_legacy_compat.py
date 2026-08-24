"""Make the Alembic baseline compatible with the original local SQLite DB."""
from alembic import op
import sqlalchemy as sa

revision = "0002_legacy_compat"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("audit_events"):
        op.create_table(
            "audit_events",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("actor", sa.String(100), nullable=False),
            sa.Column("action", sa.String(80), nullable=False),
            sa.Column("resource_type", sa.String(80), nullable=False),
            sa.Column("resource_id", sa.String(80), nullable=True),
            sa.Column("detail", sa.Text(), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )
    indexes = {index["name"] for index in sa.inspect(bind).get_indexes("audit_events")}
    if "ix_audit_events_action" not in indexes:
        op.create_index("ix_audit_events_action", "audit_events", ["action"])
    if "ix_audit_events_created_at" not in indexes:
        op.create_index("ix_audit_events_created_at", "audit_events", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_events_created_at", table_name="audit_events")
    op.drop_index("ix_audit_events_action", table_name="audit_events")
    op.drop_table("audit_events")
