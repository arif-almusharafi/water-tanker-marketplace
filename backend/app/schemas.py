"""Request bodies and their field rules (see "Field rules" in the API contract).

Arabic error messages for each field live in app/errors.py.
Unknown fields are ignored (Pydantic's default).
"""

from datetime import UTC, datetime, timedelta
from typing import Annotated, Literal

from pydantic import (
    AfterValidator,
    AwareDatetime,
    BaseModel,
    BeforeValidator,
    Field,
    StrictBool,
    StrictInt,
    StringConstraints,
    ValidationInfo,
    field_validator,
)

from app.cities import CITIES_BY_ID, district_name

PHONE_PATTERN = r"^05[0-9]{8}$"


def blank_to_none(value):
    """Trim text; an empty optional text becomes None."""
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


# Required text: outer spaces are trimmed before the length check.
Text = Annotated[str, StringConstraints(strip_whitespace=True)]
# Optional text: trimmed, and "" becomes None.
OptionalText = Annotated[str | None, BeforeValidator(blank_to_none)]
Phone = Annotated[str, StringConstraints(strip_whitespace=True, pattern=PHONE_PATTERN)]


def check_city(city_id: str) -> str:
    if city_id not in CITIES_BY_ID:
        raise ValueError("unknown city")
    return city_id


CityId = Annotated[str, StringConstraints(strip_whitespace=True), AfterValidator(check_city)]


class PricesIn(BaseModel):
    """{"6": int, "12": int, "18": int}. All three are required."""

    price_6: StrictInt = Field(alias="6", ge=1, le=5000)
    price_12: StrictInt = Field(alias="12", ge=1, le=5000)
    price_18: StrictInt = Field(alias="18", ge=1, le=5000)


class RegisterIn(BaseModel):
    name: Text = Field(min_length=2, max_length=60)
    tagline: OptionalText = Field(default=None, max_length=80)
    phone: Phone
    # Passwords are not trimmed: spaces are part of the password.
    password: str = Field(min_length=8, max_length=72)
    city_id: CityId
    driver_name: OptionalText = Field(default=None, max_length=60)
    eta_minutes: StrictInt = Field(ge=10, le=240)
    prices_sar: PricesIn
    drinking_extra_sar: StrictInt = Field(ge=0, le=1000)


class LoginIn(BaseModel):
    phone: Phone
    # No length rule here: any wrong password, short or long, gets 401 invalid_credentials.
    password: str


class SupplierUpdateIn(BaseModel):
    """PATCH /api/me. Every field is optional; only the sent fields change.

    Required columns use `default=None` with a non-null type, so sending
    `"name": null` is a validation error, while leaving `name` out is fine.
    """

    name: Text = Field(default=None, min_length=2, max_length=60)
    tagline: OptionalText = Field(default=None, max_length=80)
    driver_name: OptionalText = Field(default=None, max_length=60)
    eta_minutes: StrictInt = Field(default=None, ge=10, le=240)
    prices_sar: PricesIn = None
    drinking_extra_sar: StrictInt = Field(default=None, ge=0, le=1000)
    is_available: StrictBool = None


class OrderIn(BaseModel):
    supplier_id: StrictInt
    customer_name: Text = Field(min_length=2, max_length=60)
    customer_phone: Phone
    city_id: CityId
    # district_id is checked after city_id, so the city is known here.
    district_id: Text
    address: Text = Field(min_length=8, max_length=200)
    capacity_tons: Literal[6, 12, 18]
    water_type: Literal["regular", "drinking"]
    # delivery_time comes before scheduled_at so the scheduled_at check can read it.
    delivery_time: Literal["asap", "scheduled"]
    scheduled_at: AwareDatetime | None = Field(default=None, validate_default=True)
    notes: OptionalText = Field(default=None, max_length=300)
    payment_method: Literal["cash", "card"]

    @field_validator("district_id")
    @classmethod
    def check_district(cls, district_id: str, info: ValidationInfo) -> str:
        city_id = info.data.get("city_id")
        if city_id and district_name(city_id, district_id) is None:
            raise ValueError("district not in city")
        return district_id

    @field_validator("scheduled_at")
    @classmethod
    def check_scheduled_at(cls, scheduled_at: datetime | None, info: ValidationInfo) -> datetime | None:
        """Required for "scheduled": 5 minutes to 7 days from now. Saved as naive UTC."""
        if info.data.get("delivery_time") != "scheduled":
            return None  # ignored for "asap"
        if scheduled_at is None:
            raise ValueError("scheduled_at is required")
        now = datetime.now(UTC)
        if not now + timedelta(minutes=5) <= scheduled_at <= now + timedelta(days=7):
            raise ValueError("scheduled_at out of range")
        return scheduled_at.astimezone(UTC).replace(tzinfo=None)


class StatusIn(BaseModel):
    status: Literal["accepted", "rejected", "on_the_way", "arrived", "delivered"]
