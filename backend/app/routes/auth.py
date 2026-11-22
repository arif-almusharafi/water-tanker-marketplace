"""Supplier register, login, and logout."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.errors import ApiError
from app.models import Supplier, SupplierSession
from app.schemas import LoginIn, RegisterIn
from app.security import DUMMY_PASSWORD_HASH, create_session, current_session, hash_password, verify_password
from app.serializers import supplier_private

router = APIRouter(prefix="/api/auth")


def phone_taken() -> ApiError:
    message = "رقم الجوال مسجل من قبل"
    return ApiError(409, "phone_taken", message, {"phone": message})


@router.post("/register", status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(Supplier.id).where(Supplier.phone == body.phone)) is not None:
        raise phone_taken()

    supplier = Supplier(
        name=body.name,
        tagline=body.tagline,
        phone=body.phone,
        password_hash=hash_password(body.password),
        city_id=body.city_id,
        driver_name=body.driver_name,
        eta_minutes=body.eta_minutes,
        price_6_sar=body.prices_sar.price_6,
        price_12_sar=body.prices_sar.price_12,
        price_18_sar=body.prices_sar.price_18,
        drinking_extra_sar=body.drinking_extra_sar,
        is_available=True,
        approval_status="pending",  # hidden from customers until Arif approves
    )
    db.add(supplier)
    try:
        db.flush()  # get supplier.id for the session
    except IntegrityError:
        # Two registrations with the same phone at the same moment.
        db.rollback()
        raise phone_taken()
    token = create_session(db, supplier)
    db.commit()
    return {"token": token, "supplier": supplier_private(db, supplier)}


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    supplier = db.scalar(select(Supplier).where(Supplier.phone == body.phone))
    # Check a dummy hash for unknown phones, so both failures take the same time.
    password_ok = verify_password(body.password, supplier.password_hash if supplier else DUMMY_PASSWORD_HASH)
    if supplier is None or not password_ok:
        raise ApiError(401, "invalid_credentials", "رقم الجوال أو كلمة المرور غير صحيحة")

    token = create_session(db, supplier)
    db.commit()
    return {"token": token, "supplier": supplier_private(db, supplier)}


@router.post("/logout", status_code=204)
def logout(session: SupplierSession = Depends(current_session), db: Session = Depends(get_db)):
    db.delete(session)
    db.commit()
    return Response(status_code=204)
