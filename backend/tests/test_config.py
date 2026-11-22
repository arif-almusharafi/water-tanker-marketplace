"""QA-5: backend/.env is loaded, real environment variables win, and secrets are never logged."""

import logging
import os
import shutil
import subprocess
import sys

from fastapi.testclient import TestClient

from app import config
from app.db import describe_database
from app.main import app

PG_URL = "postgresql+psycopg://mooyah_user:secret-pass@db.example.com:5432/mooyah"


def read_database_url(tmp_path, env_file_text: str, environment: dict) -> str:
    """Run a copy of app/config.py in a temp folder that has its own .env file."""
    (tmp_path / "app").mkdir()
    shutil.copy(config.__file__, tmp_path / "app" / "config.py")
    (tmp_path / ".env").write_text(env_file_text, encoding="utf-8")
    env = {k: v for k, v in os.environ.items() if k != "DATABASE_URL"} | environment
    result = subprocess.run(
        [sys.executable, "-c", "from app import config; print(config.DATABASE_URL)"],
        cwd=tmp_path, env=env, capture_output=True, text=True, check=True,
    )
    return result.stdout.strip()


def test_env_file_is_loaded(tmp_path):
    assert read_database_url(tmp_path, f"DATABASE_URL={PG_URL}\n", {}) == PG_URL


def test_real_environment_variable_wins_over_env_file(tmp_path):
    real = "sqlite:///./from-environment.db"
    assert read_database_url(tmp_path, f"DATABASE_URL={PG_URL}\n", {"DATABASE_URL": real}) == real


def test_database_description_hides_secrets():
    text = describe_database(PG_URL)
    assert text == "postgresql database 'mooyah' on db.example.com:5432"
    assert "secret" not in text and "mooyah_user" not in text
    assert describe_database("sqlite:///./local.db").startswith("SQLite file ./local.db")


def test_startup_logs_the_database(caplog):
    with caplog.at_level(logging.INFO, logger="uvicorn.error"):
        with TestClient(app):  # entering runs the startup code
            pass
    assert "Database: SQLite file" in caplog.text
