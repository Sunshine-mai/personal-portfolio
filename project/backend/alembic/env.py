from logging.config import fileConfig
import os
from sqlalchemy import engine_from_config, inspect, pool
from alembic import context
from app.db import Base
from app import models  # noqa: F401

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL", config.get_main_option("sqlalchemy.url")))
target_metadata = Base.metadata

def run_migrations_offline():
    context.configure(url=config.get_main_option("sqlalchemy.url"), target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        inspector = inspect(connection)
        # The first local prototype created tables with Base.metadata.create_all().
        # Preserve that data, then let the compatibility revision add only missing
        # objects and establish a real Alembic version.
        if inspector.has_table("projects") and not inspector.has_table("alembic_version"):
            connection.exec_driver_sql(
                "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
            )
            # Mark the legacy database at the parent revision. This allows the
            # compatibility revision to run normally and add missing objects.
            connection.exec_driver_sql("INSERT INTO alembic_version (version_num) VALUES ('0001_baseline')")
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
