"""Test setup: a throwaway SQLite file, emptied before every test."""

import os
import tempfile

# Must be set before `app` is imported, because app.config reads it on import.
TEST_DB_PATH = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import security  # noqa: E402
from app.db import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Supplier  # noqa: E402

# Fast password hashing in tests only (the real value is in app/security.py).
security.PBKDF2_ITERATIONS = 1_000

SUPPLIER = {
    "name": "مياه النقاء",
    "tagline": "نقاء تثق به",
    "phone": "0501112233",
    "password": "strong-pass-1",
    "city_id": "riyadh",
    "driver_name": "عبدالله القحطاني",
    "eta_minutes": 25,
    "prices_sar": {"6": 120, "12": 210, "18": 300},
    "drinking_extra_sar": 30,
}

ORDER = {
    "customer_name": "أحمد العتيبي",
    "customer_phone": "0551234567",
    "city_id": "riyadh",
    "district_id": "al-narjis",
    "address": "شارع الأمير سلطان، منزل 12",
    "capacity_tons": 12,
    "water_type": "drinking",
    "delivery_time": "asap",
    "payment_method": "cash",
}


@pytest.fixture(autouse=True)
def empty_database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)


@pytest.fixture
def client():
    return TestClient(app)


def register(client, **changes) -> tuple[dict, dict]:
    """Register a supplier. Returns (auth headers, supplier JSON)."""
    response = client.post("/api/auth/register", json={**SUPPLIER, **changes})
    assert response.status_code == 201, response.text
    body = response.json()
    return {"Authorization": f"Bearer {body['token']}"}, body["supplier"]


def set_approval(phone: str, status: str = "approved") -> None:
    with SessionLocal() as db:
        supplier = db.query(Supplier).filter_by(phone=phone).one()
        supplier.approval_status = status
        db.commit()


def approved_supplier(client, **changes) -> tuple[dict, dict]:
    headers, supplier = register(client, **changes)
    set_approval(supplier["phone"])
    return headers, supplier


def place_order(client, supplier_id: int, **changes) -> dict:
    response = client.post("/api/orders", json={**ORDER, "supplier_id": supplier_id, **changes})
    assert response.status_code == 201, response.text
    return response.json()
