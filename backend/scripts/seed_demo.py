"""Fill an EMPTY database with demo data. Run by hand only, never on production.

    python -m scripts.seed_demo

Adds the 4 suppliers of the old mock file (already approved, all in Riyadh)
and a few orders in different statuses for the first supplier.
"""

import sys
from datetime import timedelta

from sqlalchemy import func, select

from app.db import SessionLocal, utc_now
from app.models import Order, Supplier
from app.routes.orders import new_reference
from app.security import hash_password

DEMO_PASSWORD = "demo-pass-123"

# (name, tagline, phone, driver, eta minutes, 6-ton price). 12 and 18 ton add 90 and 180,
# the same numbers the old mock formula gave.
DEMO_SUPPLIERS = [
    ("مياه النقاء", "نقاء تثق به، وخدمة تستحقها", "0500000001", "عبدالله القحطاني", 25, 120),
    ("وايت الخير", "موية لمنزلك، في الوقت المناسب", "0500000002", "محمد العتيبي", 35, 110),
    ("مياه الندى", "جودة في كل قطرة", "0500000003", "خالد الدوسري", 40, 130),
    ("صهاريج الرواء", "خدمة موثوقة لكل احتياج", "0500000004", "سعد الغامدي", 50, 115),
]

# (customer, phone, district, tons, water type, status, days ago it was delivered)
DEMO_ORDERS = [
    ("أحمد العتيبي", "0550000001", "al-narjis", 12, "regular", "pending", None),
    ("نورة الدوسري", "0550000002", "al-yasmin", 6, "drinking", "pending", None),
    ("فهد القحطاني", "0550000003", "al-malqa", 18, "regular", "accepted", None),
    ("سارة الشهري", "0550000004", "al-aqiq", 12, "drinking", "on_the_way", None),
    ("ريم الحربي", "0550000005", "al-narjis", 6, "regular", "delivered", 0),
    ("عبدالرحمن المطيري", "0550000006", "al-yasmin", 12, "regular", "delivered", 1),
    ("لمى العنزي", "0550000007", "al-malqa", 18, "drinking", "delivered", 3),
    ("ماجد الزهراني", "0550000008", "al-aqiq", 6, "regular", "rejected", None),
    ("هند السبيعي", "0550000009", "al-narjis", 12, "regular", "cancelled", None),
]


def seed(db) -> int:
    if db.scalar(select(func.count()).select_from(Supplier)) > 0:
        print("Stopped: the database already has suppliers. The seed runs only on an empty database.")
        return 1

    password_hash = hash_password(DEMO_PASSWORD)
    suppliers = []
    for name, tagline, phone, driver, eta, price_6 in DEMO_SUPPLIERS:
        supplier = Supplier(
            name=name,
            tagline=tagline,
            phone=phone,
            password_hash=password_hash,
            city_id="riyadh",
            driver_name=driver,
            eta_minutes=eta,
            price_6_sar=price_6,
            price_12_sar=price_6 + 90,
            price_18_sar=price_6 + 180,
            drinking_extra_sar=30,
            is_available=True,
            approval_status="approved",
        )
        db.add(supplier)
        suppliers.append(supplier)
    db.flush()

    now = utc_now()
    for customer, phone, district, tons, water, status, delivered_days_ago in DEMO_ORDERS:
        delivered_at = now - timedelta(days=delivered_days_ago) if delivered_days_ago is not None else None
        created_at = (delivered_at or now) - timedelta(hours=1)
        db.add(
            Order(
                reference=new_reference(db),
                supplier=suppliers[0],
                customer_name=customer,
                customer_phone=phone,
                city_id="riyadh",
                district_id=district,
                address="شارع تجريبي، منزل 1، عنوان للعرض فقط",
                capacity_tons=tons,
                water_type=water,
                delivery_time="asap",
                payment_method="cash",
                price_sar=suppliers[0].price_for(tons, water),
                status=status,
                delivered_at=delivered_at,
                created_at=created_at,
                updated_at=delivered_at or now,
            )
        )
    db.commit()

    print(f"Added {len(suppliers)} approved suppliers and {len(DEMO_ORDERS)} orders.")
    print(f"Demo password for every supplier: {DEMO_PASSWORD}")
    for supplier in suppliers:
        print(f"  {supplier.phone}  {supplier.name}")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    with SessionLocal() as session:
        sys.exit(seed(session))
