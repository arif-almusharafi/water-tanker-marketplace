"""Passwords, login tokens, and the "logged-in supplier" dependency."""

import hashlib
import hmac
import secrets
from datetime import timedelta

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db, utc_now
from app.errors import ApiError
from app.models import Supplier, SupplierSession

PBKDF2_ITERATIONS = 600_000  # OWASP 2023 advice for PBKDF2-SHA256
SESSION_DAYS = 30


def hash_password(password: str) -> str:
    """Slow salted hash, saved as "pbkdf2_sha256$<iterations>$<salt hex>$<hash hex>"."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    _, iterations, salt_hex, digest_hex = stored.split("$")
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations))
    return hmac.compare_digest(digest.hex(), digest_hex)


# Used when the phone is unknown, so a wrong phone takes as long as a wrong password.
DUMMY_PASSWORD_HASH = hash_password("not-a-real-password")


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: Session, supplier: Supplier) -> str:
    """Save a new session and return the plain token (shown to the client once)."""
    token = secrets.token_urlsafe(32)  # 43 URL-safe characters
    now = utc_now()
    db.add(
        SupplierSession(
            supplier_id=supplier.id,
            token_hash=hash_token(token),
            created_at=now,
            expires_at=now + timedelta(days=SESSION_DAYS),
        )
    )
    return token


def not_authenticated() -> ApiError:
    return ApiError(401, "not_authenticated", "سجل دخولك مرة ثانية")


def current_session(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> SupplierSession:
    """The session of the `Authorization: Bearer <token>` header, or 401."""
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise not_authenticated()
    session = db.scalar(
        select(SupplierSession).where(
            SupplierSession.token_hash == hash_token(token.strip()),
            SupplierSession.expires_at > utc_now(),
        )
    )
    if session is None:
        raise not_authenticated()
    return session


def current_supplier(session: SupplierSession = Depends(current_session)) -> Supplier:
    return session.supplier
