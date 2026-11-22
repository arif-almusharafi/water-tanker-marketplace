"""Create the suppliers, sessions, and orders tables.

Revision ID: 0001
Revises:
Create Date: 2026-11-22
"""

import sqlalchemy as sa

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "suppliers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(60), nullable=False),
        sa.Column("tagline", sa.String(80), nullable=True),
        sa.Column("phone", sa.String(10), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(200), nullable=False),
        sa.Column("city_id", sa.String(40), nullable=False),
        sa.Column("driver_name", sa.String(60), nullable=True),
        sa.Column("eta_minutes", sa.Integer(), nullable=False),
        sa.Column("price_6_sar", sa.Integer(), nullable=False),
        sa.Column("price_12_sar", sa.Integer(), nullable=False),
        sa.Column("price_18_sar", sa.Integer(), nullable=False),
        sa.Column("drinking_extra_sar", sa.Integer(), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False),
        sa.Column("approval_status", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_suppliers_city_approval_available",
        "suppliers",
        ["city_id", "approval_status", "is_available"],
    )

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("supplier_id", sa.Integer(), sa.ForeignKey("suppliers.id"), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("reference", sa.String(11), nullable=False, unique=True),
        sa.Column("supplier_id", sa.Integer(), sa.ForeignKey("suppliers.id"), nullable=False),
        sa.Column("customer_name", sa.String(60), nullable=False),
        sa.Column("customer_phone", sa.String(10), nullable=False),
        sa.Column("city_id", sa.String(40), nullable=False),
        sa.Column("district_id", sa.String(40), nullable=False),
        sa.Column("address", sa.String(200), nullable=False),
        sa.Column("capacity_tons", sa.Integer(), nullable=False),
        sa.Column("water_type", sa.String(20), nullable=False),
        sa.Column("delivery_time", sa.String(20), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.String(300), nullable=True),
        sa.Column("payment_method", sa.String(20), nullable=False),
        sa.Column("price_sar", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("delivered_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_orders_supplier_status", "orders", ["supplier_id", "status"])


def downgrade() -> None:
    op.drop_table("orders")
    op.drop_table("sessions")
    op.drop_table("suppliers")
