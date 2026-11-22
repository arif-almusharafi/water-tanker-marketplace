"""Alembic runs this file for every migration command."""

from logging.config import fileConfig

from sqlalchemy import create_engine

from alembic import context
from app.config import DATABASE_URL
from app.db import Base
from app import models  # noqa: F401  (registers the tables on Base.metadata)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Tests can pass another URL with config.set_main_option("sqlalchemy.url", ...).
url = config.get_main_option("sqlalchemy.url") or DATABASE_URL


def run_migrations_offline() -> None:
    """`alembic upgrade head --sql`: print the SQL instead of running it."""
    context.configure(url=url, target_metadata=Base.metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(url)
    with engine.connect() as connection:
        # render_as_batch lets later migrations alter tables on SQLite too.
        context.configure(connection=connection, target_metadata=Base.metadata, render_as_batch=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
