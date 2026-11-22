"""The one error shape of the API: {"error": {"code", "message", "fields"}}."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("mooyah")

VALIDATION_MESSAGE = "تحقق من البيانات المدخلة"
DEFAULT_FIELD_MESSAGE = "قيمة غير صحيحة"
PHONE_MESSAGE = "رقم الجوال لازم يبدأ بـ 05 ويتكون من 10 أرقام"
PRICE_MESSAGE = "السعر لازم يكون بين 1 و 5000"
SCHEDULED_AT_MESSAGE = "الموعد لازم يكون بعد الآن وخلال 7 أيام"

# Arabic message for each request field (from the "Field rules" in the API contract).
FIELD_MESSAGES = {
    "phone": PHONE_MESSAGE,
    "customer_phone": PHONE_MESSAGE,
    "password": "كلمة المرور لازم تكون 8 أحرف على الأقل",
    "name": "الاسم لازم يكون بين 2 و 60 حرف",
    "customer_name": "الاسم لازم يكون بين 2 و 60 حرف",
    "tagline": "النص طويل",
    "driver_name": "النص طويل",
    "city_id": "المدينة غير موجودة",
    "district_id": "الحي غير موجود في هذه المدينة",
    "address": "العنوان لازم يكون بين 8 و 200 حرف",
    "notes": "الملاحظات طويلة",
    "eta_minutes": "وقت الوصول لازم يكون بين 10 و 240 دقيقة",
    "prices_sar": PRICE_MESSAGE,
    "drinking_extra_sar": "المبلغ لازم يكون بين 0 و 1000",
    "capacity_tons": "حجم الوايت غير صحيح",
    "scheduled_at": SCHEDULED_AT_MESSAGE,
}


class ApiError(Exception):
    """Raise this from a route to answer with the standard error shape."""

    def __init__(self, status: int, code: str, message: str, fields: dict | None = None):
        self.status = status
        self.code = code
        self.message = message
        self.fields = fields or {}


def error_response(status: int, code: str, message: str, fields: dict | None = None) -> JSONResponse:
    body = {"error": {"code": code, "message": message, "fields": fields or {}}}
    return JSONResponse(status_code=status, content=body)


def field_message(field: str) -> str:
    if field.startswith("prices_sar"):
        return PRICE_MESSAGE
    return FIELD_MESSAGES.get(field, DEFAULT_FIELD_MESSAGE)


def validation_fields(errors: list[dict]) -> dict:
    """Turn Pydantic errors into {"field.name": "Arabic message"}."""
    fields = {}
    for error in errors:
        # loc looks like ("body", "prices_sar", "12") or ("query", "city_id").
        path = [str(part) for part in error["loc"][1:]]
        if not path or error["type"] == "json_invalid":
            continue  # the whole body is bad, not one field
        name = ".".join(path)
        fields.setdefault(name, field_message(name))
    return fields


def add_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def handle_api_error(request: Request, exc: ApiError):
        return error_response(exc.status, exc.code, exc.message, exc.fields)

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError):
        return error_response(422, "validation_error", VALIDATION_MESSAGE, validation_fields(exc.errors()))

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(request: Request, exc: StarletteHTTPException):
        # Unknown paths (404) and wrong methods (405) still use the standard shape.
        if exc.status_code == 404:
            return error_response(404, "not_found", "الرابط غير موجود")
        return error_response(exc.status_code, "http_error", DEFAULT_FIELD_MESSAGE)

    @app.middleware("http")
    async def catch_unexpected_errors(request: Request, call_next):
        # A middleware (not an exception handler) so the 500 answer still gets CORS headers.
        try:
            return await call_next(request)
        except Exception:
            logger.exception("Unexpected error on %s %s", request.method, request.url.path)
            return error_response(500, "server_error", "صار خطأ في الخادم، حاول مرة ثانية")
