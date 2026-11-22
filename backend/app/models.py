"""Database tables. Change a table here, then add an Alembic migration."""

from datetime import datetime

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base, utc_now


class Supplier(Base):
    __tablename__ = "suppliers"
    __table_args__ = (
        Index("ix_suppliers_city_approval_available", "city_id", "approval_status", "is_available"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    tagline: Mapped[str | None] = mapped_column(String(80))
    phone: Mapped[str] = mapped_column(String(10), unique=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    city_id: Mapped[str] = mapped_column(String(40))
    driver_name: Mapped[str | None] = mapped_column(String(60))
    eta_minutes: Mapped[int]
    price_6_sar: Mapped[int]
    price_12_sar: Mapped[int]
    price_18_sar: Mapped[int]
    drinking_extra_sar: Mapped[int]
    is_available: Mapped[bool] = mapped_column(default=True)
    # "pending", "approved", or "rejected". Only scripts/approve_supplier.py changes it.
    approval_status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)

    def price_for(self, capacity_tons: int, water_type: str) -> int:
        """The final order price in SAR: size price + drinking extra."""
        size_price = {6: self.price_6_sar, 12: self.price_12_sar, 18: self.price_18_sar}[capacity_tons]
        return size_price + (self.drinking_extra_sar if water_type == "drinking" else 0)


class SupplierSession(Base):
    """One login. The token itself is never saved, only its SHA-256 hash."""

    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    expires_at: Mapped[datetime]

    supplier: Mapped[Supplier] = relationship()


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (Index("ix_orders_supplier_status", "supplier_id", "status"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    reference: Mapped[str] = mapped_column(String(11), unique=True)
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"))
    customer_name: Mapped[str] = mapped_column(String(60))
    customer_phone: Mapped[str] = mapped_column(String(10))
    city_id: Mapped[str] = mapped_column(String(40))
    district_id: Mapped[str] = mapped_column(String(40))
    address: Mapped[str] = mapped_column(String(200))
    capacity_tons: Mapped[int]
    water_type: Mapped[str] = mapped_column(String(20))
    delivery_time: Mapped[str] = mapped_column(String(20))
    scheduled_at: Mapped[datetime | None]
    notes: Mapped[str | None] = mapped_column(String(300))
    payment_method: Mapped[str] = mapped_column(String(20))
    price_sar: Mapped[int]
    status: Mapped[str] = mapped_column(String(20), default="pending")
    delivered_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(default=utc_now, onupdate=utc_now)

    supplier: Mapped[Supplier] = relationship()
