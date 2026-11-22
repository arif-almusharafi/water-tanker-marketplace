# API contract: Water Tanker Marketplace (موية)

The Backend Developer and the Frontend Developer both follow this file exactly. If something here is wrong or missing, tell the Manager. Do not change it on your own.

This Idea needs both a backend and a frontend.

## Basics

| Item | Value |
|---|---|
| Backend base URL (local) | `http://127.0.0.1:8100` |
| Frontend (local) | `http://127.0.0.1:5200` |
| Path prefix | Every endpoint starts with `/api` |
| Body format | JSON, UTF-8. Arabic text is sent as is. Send `Content-Type: application/json`. |
| Unknown request fields | Ignored. |
| CORS | Origins from env `CORS_ORIGINS` (default `http://127.0.0.1:5200,http://localhost:5200`). Methods `GET, POST, PATCH`. Headers `Authorization, Content-Type`. |
| Dates in responses | ISO 8601 in UTC with `Z`, for example `"2026-11-22T09:30:00Z"`. |
| Dates in requests | ISO 8601 with a time zone (`Z` or `+03:00`). A date without a time zone is a validation error. |
| "Today" | The Asia/Riyadh day (UTC+3, no summer time). |
| Money | Whole SAR as an integer, VAT included. Field names end in `_sar`. |
| Text inputs | The server trims spaces. An empty optional text becomes `null`. |
| Paging | None. Supplier lists return up to 100 items. Supplier history returns the newest 50. |

## Authentication (suppliers only)

- Register or log in to get a `token` (random, 43 characters, URL-safe).
- Send it on every `/api/me...` request: `Authorization: Bearer <token>`.
- The token lasts 30 days. Logout deletes it on the server.
- Missing, unknown, or expired token: `401 not_authenticated`.
- Customers have no account. The order `reference` is their key.

## Errors

Every error uses this one shape:

```json
{
  "error": {
    "code": "validation_error",
    "message": "تحقق من البيانات المدخلة",
    "fields": {
      "customer_phone": "رقم الجوال لازم يبدأ بـ 05 ويتكون من 10 أرقام"
    }
  }
}
```

- `code`: stable English text. The frontend uses it for logic.
- `message`: Arabic text, safe to show to the user.
- `fields`: always present. Field name to an Arabic message. `{}` when the error is not about fields. Nested fields use a dot: `"prices_sar.12"`.
- The backend replaces FastAPI's default `422` shape with this shape.

| Status | `code` | When |
|---|---|---|
| 401 | `not_authenticated` | `/api/me...` without a valid token. |
| 401 | `invalid_credentials` | Login with a wrong phone or password. |
| 404 | `supplier_not_found` | `supplier_id` does not exist. |
| 404 | `order_not_found` | Unknown reference, or (for `/api/me/...`) an order that belongs to another supplier. |
| 409 | `phone_taken` | Register with a phone that already exists. `fields.phone` is set. |
| 409 | `supplier_unavailable` | Order for a supplier that is not `approved` or has `is_available = false`. `message`: "المورد غير متاح حالياً، اختر مورداً آخر". |
| 409 | `invalid_status_change` | Supplier status change not allowed from the current status. |
| 409 | `cannot_cancel` | Customer cancel when status is not `pending` or `accepted`. |
| 422 | `validation_error` | Any field rule below is broken. `fields` lists each bad field. |
| 422 | `supplier_other_city` | The supplier's city is not the order's `city_id`. |
| 500 | `server_error` | Unexpected error. `message`: "صار خطأ في الخادم، حاول مرة ثانية". |
| 503 | `database_unavailable` | Only from `/api/health`. |

## Fixed values

**Capacities (tons):** `6`, `12`, `18`.

**Water type:** `regular` (مياه عادية), `drinking` (مياه شرب).

**Delivery time:** `asap` (في أقرب وقت), `scheduled` (جدولة لوقت لاحق).

**Payment method:** `cash` (نقداً عند الاستلام), `card` (شبكة / مدى عند الاستلام).

**Supplier approval status:** `pending` (new, waiting for Arif), `approved` (visible to customers), `rejected` (not visible). New suppliers start `pending`. Only the backend script `backend/scripts/approve_supplier.py` (and the demo seed) changes it. No endpoint changes it.

**Who customers see:** a supplier is visible and can receive new orders only when `approval_status = "approved"` **and** `is_available = true`. Pending and rejected suppliers can still log in, read `/api/me`, `PATCH /api/me`, and use the order endpoints (they simply have no new orders).

**Order status:**

| Value | Arabic label | Timeline step | Final? |
|---|---|---|---|
| `pending` | تم استلام الطلب | 0 | no |
| `accepted` | وافق المورد | 1 | no |
| `on_the_way` | الوايت في الطريق | 2 | no |
| `arrived` | وصل إلى الموقع | 3 | no |
| `delivered` | تم التسليم | 4 | yes |
| `rejected` | رفض المورد الطلب | none | yes |
| `cancelled` | ملغي | none | yes |

**Allowed status changes:**

| Who | From | To |
|---|---|---|
| Supplier | `pending` | `accepted`, `rejected` |
| Supplier | `accepted` | `on_the_way`, `delivered` |
| Supplier | `on_the_way` | `arrived`, `delivered` |
| Supplier | `arrived` | `delivered` |
| Customer | `pending`, `accepted` | `cancelled` |

Anything else: `409 invalid_status_change` (supplier) or `409 cannot_cancel` (customer). The server does not check `is_available` on status changes.

**Supplier order groups** (for `GET /api/me/orders?group=`):

| group | Statuses | Sort |
|---|---|---|
| `incoming` | `pending` | `created_at` oldest first |
| `active` | `accepted`, `on_the_way`, `arrived` | `created_at` oldest first |
| `history` | `delivered`, `rejected`, `cancelled` | `updated_at` newest first, at most 50 |

**Cities config** (in backend code, not in the database). Ids are unique across all cities.

| City id | City | District ids and names |
|---|---|---|
| `riyadh` | الرياض | `al-narjis` النرجس, `al-yasmin` الياسمين, `al-malqa` الملقا, `al-aqiq` العقيق |
| `jeddah` | جدة | `al-safa` الصفا, `al-rawdah` الروضة, `north-obhur` أبحر الشمالية |
| `dammam` | الدمام | `al-shati` الشاطئ, `al-faisaliyah` الفيصلية, `al-noor` النور |

## Field rules

| Field | Rule | Arabic message when broken |
|---|---|---|
| `phone`, `customer_phone` | `^05[0-9]{8}$` (10 digits) | رقم الجوال لازم يبدأ بـ 05 ويتكون من 10 أرقام |
| `password` | 8 to 72 characters | كلمة المرور لازم تكون 8 أحرف على الأقل |
| `name`, `customer_name` | 2 to 60 characters | الاسم لازم يكون بين 2 و 60 حرف |
| `tagline` | optional, max 80 | النص طويل |
| `driver_name` | optional, max 60 | النص طويل |
| `city_id` | in the cities config | المدينة غير موجودة |
| `district_id` | in the chosen city | الحي غير موجود في هذه المدينة |
| `address` | 8 to 200 characters | العنوان لازم يكون بين 8 و 200 حرف |
| `notes` | optional, max 300 | الملاحظات طويلة |
| `eta_minutes` | integer 10 to 240 | وقت الوصول لازم يكون بين 10 و 240 دقيقة |
| `prices_sar.6`, `.12`, `.18` | integer 1 to 5000, all three required | السعر لازم يكون بين 1 و 5000 |
| `drinking_extra_sar` | integer 0 to 1000 | المبلغ لازم يكون بين 0 و 1000 |
| `capacity_tons` | 6, 12, or 18 | حجم الوايت غير صحيح |
| `water_type`, `delivery_time`, `payment_method` | one of the fixed values | قيمة غير صحيحة |
| `scheduled_at` | required when `delivery_time` is `scheduled`: at least 5 minutes and at most 7 days from now. Ignored and saved as `null` when `asap`. | الموعد لازم يكون بعد الآن وخلال 7 أيام |
| `is_available` | boolean | قيمة غير صحيحة |
| any other bad value | | قيمة غير صحيحة |

## Data shapes

**City**

```json
{ "id": "riyadh", "name": "الرياض", "districts": [ { "id": "al-narjis", "name": "النرجس" } ] }
```

**SupplierPublic** (what customers see)

| Field | Type | Can be null |
|---|---|---|
| id | integer | no |
| name | string | no |
| tagline | string | yes |
| city_id | string | no |
| eta_minutes | integer | no |
| prices_sar | object `{"6": int, "12": int, "18": int}` | no |
| drinking_extra_sar | integer | no |
| delivered_orders_count | integer (count of this supplier's `delivered` orders) | no |

There is no `is_verified` field: every supplier in a public list is approved, so the frontend shows the verified badge on all of them.

**SupplierPrivate** (what the logged-in supplier sees) = all SupplierPublic fields, plus:

| Field | Type | Can be null |
|---|---|---|
| phone | string | no |
| driver_name | string | yes |
| is_available | boolean | no |
| approval_status | `pending`, `approved`, or `rejected` | no |
| created_at | datetime | no |

**OrderForCustomer**

| Field | Type | Can be null |
|---|---|---|
| reference | string `MW-XXXXXXXX` | no |
| status | order status | no |
| supplier | object, see below | no |
| city_id, city_name | string | no |
| district_id, district_name | string | no |
| address | string | no |
| capacity_tons | integer | no |
| water_type | string | no |
| delivery_time | string | no |
| scheduled_at | datetime | yes |
| notes | string | yes |
| payment_method | string | no |
| price_sar | integer | no |
| created_at, updated_at | datetime | no |

`supplier` inside it: `id` (int), `name` (string), `driver_name` (string or null), `eta_minutes` (int), `phone` (string or null). `phone` is filled only when the status is `accepted`, `on_the_way`, or `arrived`; otherwise `null`.
OrderForCustomer never contains the customer name or the customer phone.

**OrderForSupplier**: the same fields as OrderForCustomer except `supplier`, plus:

| Field | Type | Can be null |
|---|---|---|
| customer_name | string | no |
| customer_phone | string | no |
| delivered_at | datetime | yes |

## Endpoints

| # | Method | Path | Auth | Feature |
|---|---|---|---|---|
| 1 | GET | `/api/health` | no | F19 |
| 2 | GET | `/api/cities` | no | F1 |
| 3 | GET | `/api/suppliers?city_id=` | no | F4 |
| 4 | POST | `/api/orders` | no | F5 |
| 5 | GET | `/api/orders/{reference}` | no | F6 |
| 6 | POST | `/api/orders/{reference}/cancel` | no | F7 |
| 7 | POST | `/api/auth/register` | no | F2 |
| 8 | POST | `/api/auth/login` | no | F3 |
| 9 | POST | `/api/auth/logout` | yes | F3 |
| 10 | GET | `/api/me` | yes | F3, F10, F14, F17 |
| 11 | PATCH | `/api/me` | yes | F10, F17 |
| 12 | GET | `/api/me/orders?group=` | yes | F8, F9, F18 |
| 13 | POST | `/api/me/orders/{reference}/status` | yes | F8, F9, F15 |
| 14 | GET | `/api/me/stats` | yes | F16 |

Must features with no endpoint of their own: F11 (empty states: the frontend shows them when a list is `[]`), F12 (database: Alembic migrations), F13 (demo seed: a script run by hand), F14 (approval: Arif uses the script `backend/scripts/approve_supplier.py`; the supplier reads the result in `approval_status` from endpoints 7, 8, and 10).

Note: `/api/suppliers` is the public list. `/api/me` is always the logged-in supplier.
`{reference}` is matched without caring about case or outer spaces (`mw-7k3p9qx2` finds `MW-7K3P9QX2`).

### 1. GET `/api/health`

- `200`: `{"status": "ok"}`
- `503`: `database_unavailable` when the database does not answer.

### 2. GET `/api/cities`

- `200`:

```json
{
  "items": [
    {
      "id": "riyadh",
      "name": "الرياض",
      "districts": [
        { "id": "al-narjis", "name": "النرجس" },
        { "id": "al-yasmin", "name": "الياسمين" },
        { "id": "al-malqa", "name": "الملقا" },
        { "id": "al-aqiq", "name": "العقيق" }
      ]
    }
  ]
}
```

(The real answer has all 3 cities, in the order of the config table.)

### 3. GET `/api/suppliers?city_id=riyadh`

Returns suppliers in that city with `approval_status = "approved"` and `is_available = true`. Pending and rejected suppliers are never returned. Sorted by `eta_minutes`, then `id`. At most 100.

- `200`:

```json
{
  "items": [
    {
      "id": 1,
      "name": "مياه النقاء",
      "tagline": "نقاء تثق به، وخدمة تستحقها",
      "city_id": "riyadh",
      "eta_minutes": 25,
      "prices_sar": { "6": 120, "12": 210, "18": 300 },
      "drinking_extra_sar": 30,
      "delivered_orders_count": 12
    }
  ]
}
```

- Empty city: `200` with `{"items": []}`.
- `422 validation_error`: `city_id` missing or unknown (`fields.city_id`).

Display price on the frontend = `prices_sar[capacity] + (water_type == "drinking" ? drinking_extra_sar : 0)`. The server uses the same rule in endpoint 4.

### 4. POST `/api/orders`

Request:

```json
{
  "supplier_id": 1,
  "customer_name": "أحمد العتيبي",
  "customer_phone": "0551234567",
  "city_id": "riyadh",
  "district_id": "al-narjis",
  "address": "شارع الأمير سلطان، منزل 12، قرب مسجد النور",
  "capacity_tons": 12,
  "water_type": "drinking",
  "delivery_time": "scheduled",
  "scheduled_at": "2026-11-23T13:30:00Z",
  "notes": "الخزان أرضي",
  "payment_method": "cash"
}
```

`notes` and `scheduled_at` may be `null` or missing. All other fields are required.

- `201`: OrderForCustomer, with status `pending` and `price_sar` computed by the server:

```json
{
  "reference": "MW-7K3P9QX2",
  "status": "pending",
  "supplier": {
    "id": 1,
    "name": "مياه النقاء",
    "driver_name": "عبدالله القحطاني",
    "eta_minutes": 25,
    "phone": null
  },
  "city_id": "riyadh",
  "city_name": "الرياض",
  "district_id": "al-narjis",
  "district_name": "النرجس",
  "address": "شارع الأمير سلطان، منزل 12، قرب مسجد النور",
  "capacity_tons": 12,
  "water_type": "drinking",
  "delivery_time": "scheduled",
  "scheduled_at": "2026-11-23T13:30:00Z",
  "notes": "الخزان أرضي",
  "payment_method": "cash",
  "price_sar": 240,
  "created_at": "2026-11-22T09:30:00Z",
  "updated_at": "2026-11-22T09:30:00Z"
}
```

- `404 supplier_not_found`
- `409 supplier_unavailable` (supplier not `approved`, or `is_available = false`)
- `422 supplier_other_city`
- `422 validation_error`

### 5. GET `/api/orders/{reference}`

- `200`: OrderForCustomer (same shape as above).
- `404 order_not_found`

### 6. POST `/api/orders/{reference}/cancel`

No request body.

- `200`: OrderForCustomer with `"status": "cancelled"`.
- `404 order_not_found`
- `409 cannot_cancel` (status is not `pending` or `accepted`).

### 7. POST `/api/auth/register`

Request:

```json
{
  "name": "مياه النقاء",
  "tagline": "نقاء تثق به، وخدمة تستحقها",
  "phone": "0501112233",
  "password": "strong-pass-1",
  "city_id": "riyadh",
  "driver_name": "عبدالله القحطاني",
  "eta_minutes": 25,
  "prices_sar": { "6": 120, "12": 210, "18": 300 },
  "drinking_extra_sar": 30
}
```

`tagline` and `driver_name` may be `null` or missing. New suppliers get `is_available = true` and `approval_status = "pending"`. They are logged in at once but stay hidden from customers until Arif approves them.

- `201`:

```json
{
  "token": "q2V9n3...43-characters...",
  "supplier": {
    "id": 5,
    "name": "مياه النقاء",
    "tagline": "نقاء تثق به، وخدمة تستحقها",
    "city_id": "riyadh",
    "eta_minutes": 25,
    "prices_sar": { "6": 120, "12": 210, "18": 300 },
    "drinking_extra_sar": 30,
    "delivered_orders_count": 0,
    "phone": "0501112233",
    "driver_name": "عبدالله القحطاني",
    "is_available": true,
    "approval_status": "pending",
    "created_at": "2026-11-22T09:00:00Z"
  }
}
```

- `409 phone_taken`
- `422 validation_error`

### 8. POST `/api/auth/login`

Request: `{"phone": "0501112233", "password": "strong-pass-1"}`

- `200`: same shape as the register `201` (`token` + SupplierPrivate). Works for `pending`, `approved`, and `rejected` suppliers; the dashboard reads `approval_status`.
- `401 invalid_credentials` (same answer for an unknown phone and a wrong password). `message`: "رقم الجوال أو كلمة المرور غير صحيحة".
- `422 validation_error`

### 9. POST `/api/auth/logout`

No request body. Deletes the session of the sent token.

- `204`: no body.
- `401 not_authenticated`

### 10. GET `/api/me`

- `200`: SupplierPrivate.
- `401 not_authenticated`

### 11. PATCH `/api/me`

Request: any subset of these fields. Fields not sent stay the same. `phone`, `password`, `city_id`, and `approval_status` cannot change here (they are ignored).

```json
{
  "name": "مياه النقاء",
  "tagline": null,
  "driver_name": "خالد الدوسري",
  "eta_minutes": 30,
  "prices_sar": { "6": 125, "12": 215, "18": 310 },
  "drinking_extra_sar": 25,
  "is_available": false
}
```

If `prices_sar` is sent, all three keys are required.

- `200`: SupplierPrivate after the change.
- `401 not_authenticated`
- `422 validation_error`

### 12. GET `/api/me/orders?group=incoming`

`group` is `incoming`, `active`, or `history` (see Fixed values). Only this supplier's orders.

- `200`:

```json
{
  "items": [
    {
      "reference": "MW-7K3P9QX2",
      "status": "pending",
      "customer_name": "أحمد العتيبي",
      "customer_phone": "0551234567",
      "city_id": "riyadh",
      "city_name": "الرياض",
      "district_id": "al-narjis",
      "district_name": "النرجس",
      "address": "شارع الأمير سلطان، منزل 12، قرب مسجد النور",
      "capacity_tons": 12,
      "water_type": "drinking",
      "delivery_time": "asap",
      "scheduled_at": null,
      "notes": null,
      "payment_method": "cash",
      "price_sar": 240,
      "delivered_at": null,
      "created_at": "2026-11-22T09:30:00Z",
      "updated_at": "2026-11-22T09:30:00Z"
    }
  ]
}
```

- No orders: `200` with `{"items": []}`.
- `401 not_authenticated`
- `422 validation_error` (`group` missing or not one of the three).

### 13. POST `/api/me/orders/{reference}/status`

Request: `{"status": "accepted"}`. Allowed values: `accepted`, `rejected`, `on_the_way`, `arrived`, `delivered`.
When the new status is `delivered`, the server sets `delivered_at` to now.

- `200`: OrderForSupplier after the change.
- `401 not_authenticated`
- `404 order_not_found` (also when the order belongs to another supplier).
- `409 invalid_status_change`, for example:

```json
{
  "error": {
    "code": "invalid_status_change",
    "message": "ما يمكن تغيير حالة الطلب من ملغي إلى وافق المورد",
    "fields": {}
  }
}
```

- `422 validation_error` (unknown status value).

### 14. GET `/api/me/stats`

- `200`:

```json
{
  "pending_count": 2,
  "active_count": 1,
  "delivered_today_count": 3,
  "revenue_today_sar": 540,
  "delivered_total_count": 12,
  "revenue_last_7_days": [
    { "date": "2026-11-16", "revenue_sar": 0 },
    { "date": "2026-11-17", "revenue_sar": 330 },
    { "date": "2026-11-18", "revenue_sar": 120 },
    { "date": "2026-11-19", "revenue_sar": 0 },
    { "date": "2026-11-20", "revenue_sar": 450 },
    { "date": "2026-11-21", "revenue_sar": 210 },
    { "date": "2026-11-22", "revenue_sar": 540 }
  ]
}
```

- `revenue_last_7_days` always has 7 items, oldest first, the last one is today (Asia/Riyadh). `date` is `YYYY-MM-DD`.
- Revenue = sum of `price_sar` of `delivered` orders, grouped by the Riyadh date of `delivered_at`.
- `401 not_authenticated`

## Frontend routes (hash routes, for reference)

| Route | Page |
|---|---|
| `#/` | Home (existing) |
| `#/order` | Order (existing, 4 steps) |
| `#/tracking?ref=MW-XXXXXXXX` | Tracking (existing, now loads from endpoint 5) |
| `#/supplier/register` | New: supplier registration (endpoint 7) |
| `#/supplier/login` | New: supplier login (endpoint 8) |
| `#/dashboard` | Supplier dashboard (existing). Shows the login page when there is no valid token. |

Browser storage keys: `mooyah_supplier_token` (supplier token), `mooyah_last_order` (last order reference).
Refresh timers: tracking every 20 seconds while the status is not final; dashboard orders and stats every 30 seconds.
