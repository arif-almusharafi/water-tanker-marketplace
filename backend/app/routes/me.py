"""Endpoints for the logged-in supplier: profile, orders, status changes, stats."""

from datetime import date, datetime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db, utc_now
from app.errors import ApiError
from app.models import Order, Supplier
from app.routes.orders import find_order
from app.schemas import StatusIn, SupplierUpdateIn
from app.security import current_supplier
from app.serializers import order_for_supplier, supplier_private
from app.statuses import HISTORY_LIMIT, ORDER_GROUPS, STATUS_LABELS, SUPPLIER_CHANGES

router = APIRouter(prefix="/api/me")

# Asia/Riyadh is always UTC+3 (no summer time), so a fixed offset is enough.
RIYADH_OFFSET = timedelta(hours=3)


@router.get("")
def get_me(supplier: Supplier = Depends(current_supplier), db: Session = Depends(get_db)):
    return supplier_private(db, supplier)


@router.patch("")
def update_me(
    body: SupplierUpdateIn,
    supplier: Supplier = Depends(current_supplier),
    db: Session = Depends(get_db),
):
    # Only fields the client sent. phone, password, city_id, approval_status are not in the schema.
    changes = body.model_dump(exclude_unset=True, exclude={"prices_sar"})
    for field, value in changes.items():
        setattr(supplier, field, value)
    if "prices_sar" in body.model_fields_set:
        supplier.price_6_sar = body.prices_sar.price_6
        supplier.price_12_sar = body.prices_sar.price_12
        supplier.price_18_sar = body.prices_sar.price_18
    db.commit()
    return supplier_private(db, supplier)


@router.get("/orders")
def list_my_orders(
    group: Literal["incoming", "active", "history"],
    supplier: Supplier = Depends(current_supplier),
    db: Session = Depends(get_db),
):
    query = select(Order).where(Order.supplier_id == supplier.id, Order.status.in_(ORDER_GROUPS[group]))
    if group == "history":
        query = query.order_by(Order.updated_at.desc(), Order.id.desc()).limit(HISTORY_LIMIT)
    else:
        query = query.order_by(Order.created_at, Order.id)
    return {"items": [order_for_supplier(order) for order in db.scalars(query)]}


@router.post("/orders/{reference}/status")
def change_order_status(
    reference: str,
    body: StatusIn,
    supplier: Supplier = Depends(current_supplier),
    db: Session = Depends(get_db),
):
    order = find_order(db, reference)
    if order.supplier_id != supplier.id:
        # Same answer as an unknown reference, so suppliers cannot probe other orders.
        raise ApiError(404, "order_not_found", "ما لقينا طلب بهذا الرقم")
    if body.status not in SUPPLIER_CHANGES.get(order.status, set()):
        message = f"ما يمكن تغيير حالة الطلب من {STATUS_LABELS[order.status]} إلى {STATUS_LABELS[body.status]}"
        raise ApiError(409, "invalid_status_change", message)

    order.status = body.status
    if body.status == "delivered":
        order.delivered_at = utc_now()
    db.commit()
    return order_for_supplier(order)


def riyadh_date(utc_time: datetime) -> date:
    return (utc_time + RIYADH_OFFSET).date()


@router.get("/stats")
def my_stats(supplier: Supplier = Depends(current_supplier), db: Session = Depends(get_db)):
    def count(statuses: list[str]) -> int:
        return db.scalar(
            select(func.count()).where(Order.supplier_id == supplier.id, Order.status.in_(statuses))
        )

    today = riyadh_date(utc_now())
    first_day = today - timedelta(days=6)
    # Riyadh midnight of the first day, written as naive UTC like the saved times.
    since = datetime.combine(first_day, datetime.min.time()) - RIYADH_OFFSET

    revenue_by_day = {first_day + timedelta(days=i): 0 for i in range(7)}
    delivered_today = 0
    delivered_rows = db.execute(
        select(Order.delivered_at, Order.price_sar).where(
            Order.supplier_id == supplier.id,
            Order.status == "delivered",
            Order.delivered_at >= since,
        )
    )
    for delivered_at, price_sar in delivered_rows:
        day = riyadh_date(delivered_at)
        if day in revenue_by_day:  # skip a delivery saved "in the future" by clock drift
            revenue_by_day[day] += price_sar
        if day == today:
            delivered_today += 1

    return {
        "pending_count": count(ORDER_GROUPS["incoming"]),
        "active_count": count(ORDER_GROUPS["active"]),
        "delivered_today_count": delivered_today,
        "revenue_today_sar": revenue_by_day[today],
        "delivered_total_count": count(["delivered"]),
        "revenue_last_7_days": [
            {"date": day.isoformat(), "revenue_sar": revenue} for day, revenue in revenue_by_day.items()
        ],
    }
