"""Approve or reject suppliers. Run from backend/ (uses the same DATABASE_URL as the app).

    python -m scripts.approve_supplier --list-pending
    python -m scripts.approve_supplier --phone 05XXXXXXXX
    python -m scripts.approve_supplier --phone 05XXXXXXXX --reject
"""

import argparse
import re
import sys

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Supplier
from app.schemas import PHONE_PATTERN


def list_pending(db) -> int:
    suppliers = db.scalars(
        select(Supplier).where(Supplier.approval_status == "pending").order_by(Supplier.created_at, Supplier.id)
    ).all()
    if not suppliers:
        print("No pending suppliers.")
    for s in suppliers:
        print(f"{s.id}\t{s.name}\t{s.phone}\t{s.city_id}\t{s.created_at:%Y-%m-%d %H:%M} UTC")
    return 0


def set_status(db, phone: str, reject: bool) -> int:
    phone = phone.strip()
    if not re.fullmatch(PHONE_PATTERN, phone):
        print(f"Error: '{phone}' is not a valid phone. Use 05 and 8 more digits, for example 0501112233.")
        return 1
    supplier = db.scalar(select(Supplier).where(Supplier.phone == phone))
    if supplier is None:
        print(f"Error: no supplier with phone {phone}.")
        return 1

    supplier.approval_status = "rejected" if reject else "approved"
    db.commit()
    print(f"{'Rejected' if reject else 'Approved'}: {supplier.name} ({supplier.phone})")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Approve or reject suppliers.")
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--list-pending", action="store_true", help="show suppliers waiting for approval")
    action.add_argument("--phone", help="the supplier phone, for example 0501112233")
    parser.add_argument("--reject", action="store_true", help="reject instead of approve (needs --phone)")
    args = parser.parse_args(argv)
    if args.reject and not args.phone:
        parser.error("--reject needs --phone")

    with SessionLocal() as db:
        if args.list_pending:
            return list_pending(db)
        return set_status(db, args.phone, args.reject)


if __name__ == "__main__":
    # Arabic names print correctly even on a Windows console.
    sys.stdout.reconfigure(encoding="utf-8")
    sys.exit(main())
