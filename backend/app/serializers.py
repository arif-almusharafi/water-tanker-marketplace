"""Turn database rows into the JSON shapes of the API contract.

Customer phones and password hashes never leave through the public shapes.
"""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.cities import CITIES_BY_ID, district_name
from app.models import Order, Supplier
from app.statuses import SHOW_SUPPLIER_PHONE


def iso(value: datetime | None) -> str | None:
    """Naive UTC datetime -> "2026-11-22T09:30:00Z"."""
    return value.strftime("%Y-%m-%dT%H:%M:%SZ") if value else None


def delivered_counts(db: Session, supplier_ids: list[int]) -> dict[int, int]:
    """{supplier_id: number of delivered orders}, in one query."""
    rows = db.execute(
        select(Order.supplier_id, func.count())
        .where(Order.supplier_id.in_(supplier_ids), Order.status == "delivered")
        .group_by(Order.supplier_id)
    )
    return dict(rows.all())


def supplier_public(supplier: Supplier, delivered_count: int) -> dict:
    return {
        "id": supplier.id,
        "name": supplier.name,
        "tagline": supplier.tagline,
        "city_id": supplier.city_id,
        "eta_minutes": supplier.eta_minutes,
        "prices_sar": {
            "6": supplier.price_6_sar,
            "12": supplier.price_12_sar,
            "18": supplier.price_18_sar,
        },
        "drinking_extra_sar": supplier.drinking_extra_sar,
        "delivered_orders_count": delivered_count,
    }


def supplier_private(db: Session, supplier: Supplier) -> dict:
    """What the logged-in supplier sees about themself."""
    count = delivered_counts(db, [supplier.id]).get(supplier.id, 0)
    return {
        **supplier_public(supplier, count),
        "phone": supplier.phone,
        "driver_name": supplier.driver_name,
        "is_available": supplier.is_available,
        "approval_status": supplier.approval_status,
        "created_at": iso(supplier.created_at),
    }


def _order_common(order: Order) -> dict:
    return {
        "reference": order.reference,
        "status": order.status,
        "city_id": order.city_id,
        "city_name": CITIES_BY_ID[order.city_id]["name"],
        "district_id": order.district_id,
        "district_name": district_name(order.city_id, order.district_id),
        "address": order.address,
        "capacity_tons": order.capacity_tons,
        "water_type": order.water_type,
        "delivery_time": order.delivery_time,
        "scheduled_at": iso(order.scheduled_at),
        "notes": order.notes,
        "payment_method": order.payment_method,
        "price_sar": order.price_sar,
        "created_at": iso(order.created_at),
        "updated_at": iso(order.updated_at),
    }


def order_for_customer(order: Order) -> dict:
    """No customer name or phone here: anyone with the reference can read it."""
    supplier = order.supplier
    return {
        **_order_common(order),
        "supplier": {
            "id": supplier.id,
            "name": supplier.name,
            "driver_name": supplier.driver_name,
            "eta_minutes": supplier.eta_minutes,
            "phone": supplier.phone if order.status in SHOW_SUPPLIER_PHONE else None,
        },
    }


def order_for_supplier(order: Order) -> dict:
    return {
        **_order_common(order),
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "delivered_at": iso(order.delivered_at),
    }
