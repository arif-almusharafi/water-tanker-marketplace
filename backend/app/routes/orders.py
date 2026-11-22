"""Customer order endpoints. Customers have no account: the reference is the key."""

import secrets

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.errors import ApiError
from app.models import Order, Supplier
from app.schemas import OrderIn
from app.serializers import order_for_customer
from app.statuses import CANCELLABLE

router = APIRouter(prefix="/api/orders")

# No 0/O, 1/I/L: easy to read out loud. 31^8 options, so it cannot be guessed.
REFERENCE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def new_reference(db: Session) -> str:
    while True:
        reference = "MW-" + "".join(secrets.choice(REFERENCE_ALPHABET) for _ in range(8))
        if db.scalar(select(Order.id).where(Order.reference == reference)) is None:
            return reference


def find_order(db: Session, reference: str) -> Order:
    """Find an order by reference, ignoring case and outer spaces, or 404."""
    order = db.scalar(select(Order).where(Order.reference == reference.strip().upper()))
    if order is None:
        raise ApiError(404, "order_not_found", "ما لقينا طلب بهذا الرقم")
    return order


@router.post("", status_code=201)
def create_order(body: OrderIn, db: Session = Depends(get_db)):
    supplier = db.get(Supplier, body.supplier_id)
    if supplier is None:
        raise ApiError(404, "supplier_not_found", "المورد غير موجود")
    if supplier.approval_status != "approved" or not supplier.is_available:
        raise ApiError(409, "supplier_unavailable", "المورد غير متاح حالياً، اختر مورداً آخر")
    if supplier.city_id != body.city_id:
        raise ApiError(422, "supplier_other_city", "المورد لا يخدم هذه المدينة")

    order = Order(
        reference=new_reference(db),
        supplier=supplier,
        customer_name=body.customer_name,
        customer_phone=body.customer_phone,
        city_id=body.city_id,
        district_id=body.district_id,
        address=body.address,
        capacity_tons=body.capacity_tons,
        water_type=body.water_type,
        delivery_time=body.delivery_time,
        scheduled_at=body.scheduled_at,
        notes=body.notes,
        payment_method=body.payment_method,
        # The server sets the price; the client price is never trusted.
        price_sar=supplier.price_for(body.capacity_tons, body.water_type),
        status="pending",
    )
    db.add(order)
    db.commit()
    return order_for_customer(order)


@router.get("/{reference}")
def get_order(reference: str, db: Session = Depends(get_db)):
    return order_for_customer(find_order(db, reference))


@router.post("/{reference}/cancel")
def cancel_order(reference: str, db: Session = Depends(get_db)):
    order = find_order(db, reference)
    if order.status not in CANCELLABLE:
        raise ApiError(409, "cannot_cancel", "ما يمكن إلغاء الطلب بعد خروج الوايت")
    order.status = "cancelled"
    db.commit()
    return order_for_customer(order)
