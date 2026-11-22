import os
import tempfile

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

from conftest import register
from scripts import approve_supplier, seed_demo
from app.db import SessionLocal


def test_approve_list_and_reject(client, capsys):
    assert approve_supplier.main(["--list-pending"]) == 0
    assert "No pending suppliers." in capsys.readouterr().out

    _, supplier = register(client)
    approve_supplier.main(["--list-pending"])
    assert supplier["phone"] in capsys.readouterr().out

    assert approve_supplier.main(["--phone", supplier["phone"]]) == 0
    assert capsys.readouterr().out.strip() == f"Approved: {supplier['name']} ({supplier['phone']})"
    assert len(client.get("/api/suppliers?city_id=riyadh").json()["items"]) == 1

    assert approve_supplier.main(["--phone", supplier["phone"], "--reject"]) == 0
    assert capsys.readouterr().out.startswith("Rejected:")
    assert client.get("/api/suppliers?city_id=riyadh").json()["items"] == []


def test_approve_bad_or_unknown_phone_exits_1(client, capsys):
    assert approve_supplier.main(["--phone", "12345"]) == 1
    assert approve_supplier.main(["--phone", "0599999999"]) == 1
    assert "Error" in capsys.readouterr().out


def test_seed_fills_empty_database_once(client, capsys):
    with SessionLocal() as db:
        assert seed_demo.seed(db) == 0
    assert len(client.get("/api/suppliers?city_id=riyadh").json()["items"]) == 4
    login = client.post("/api/auth/login", json={"phone": "0500000001", "password": seed_demo.DEMO_PASSWORD})
    assert login.status_code == 200

    with SessionLocal() as db:
        assert seed_demo.seed(db) == 1
    assert "Stopped" in capsys.readouterr().out


def test_migrations_create_every_table():
    url = f"sqlite:///{os.path.join(tempfile.mkdtemp(), 'migrate.db')}"
    config = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    config.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "..", "alembic"))
    config.set_main_option("sqlalchemy.url", url)
    command.upgrade(config, "head")
    tables = set(inspect(create_engine(url)).get_table_names())
    assert {"suppliers", "sessions", "orders", "alembic_version"} <= tables
