"""Public endpoints: health, cities, and the supplier list for customers."""

from fastapi import APIRouter, Depends
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.cities import CITIES, CITIES_BY_ID
from app.db import get_db
from app.errors import FIELD_MESSAGES, VALIDATION_MESSAGE, ApiError, error_response
from app.models import Supplier
from app.serializers import delivered_counts, supplier_public

router = APIRouter(prefix="/api")

SUPPLIER_LIST_LIMIT = 100


@router.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return error_response(503, "database_unavailable", "قاعدة البيانات غير متاحة حالياً")
    return {"status": "ok"}


@router.get("/cities")
def list_cities():
    return {"items": CITIES}


@router.get("/suppliers")
def list_suppliers(city_id: str = "", db: Session = Depends(get_db)):
    """Approved and available suppliers in one city, fastest first."""
    city_id = city_id.strip()
    if city_id not in CITIES_BY_ID:
        raise ApiError(422, "validation_error", VALIDATION_MESSAGE, {"city_id": FIELD_MESSAGES["city_id"]})

    suppliers = db.scalars(
        select(Supplier)
        .where(
            Supplier.city_id == city_id,
            Supplier.approval_status == "approved",
            Supplier.is_available.is_(True),
        )
        .order_by(Supplier.eta_minutes, Supplier.id)
        .limit(SUPPLIER_LIST_LIMIT)
    ).all()
    counts = delivered_counts(db, [s.id for s in suppliers])
    return {"items": [supplier_public(s, counts.get(s.id, 0)) for s in suppliers]}
