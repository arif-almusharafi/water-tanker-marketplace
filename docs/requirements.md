# Requirements: Water Tanker Marketplace (موية)

Idea 5 · slug `water-tanker-marketplace` · Backend: Python FastAPI + PostgreSQL · Frontend: React (Vite)

## Goal

Turn Arif's Arabic, right to left React frontend (`source/`) into a real, deployable MVP.
Customers order a water tanker (وايت) from a supplier in their city and track it with an order reference.
Suppliers register themselves, wait for Arif's approval, log in, set their prices, and accept, reject, and complete orders.
All data comes from a FastAPI backend and a database. There is no mock data in the app.

## Users

| User | Account? | What they do |
|---|---|---|
| Customer | No account | Picks a city, a tanker size, and a supplier, places an order, tracks it by reference, can cancel early. |
| Supplier | Yes (phone + password) | Registers, waits for approval, logs in, sets availability and prices, handles incoming orders. |
| Arif (owner) | No admin web page in v1 | Deploys, runs migrations, approves or rejects suppliers with a command-line script, runs the demo seed by hand. |

## Research notes

- Saudi listings mostly sell tankers by tons (6, 18, and 32 ton are common). Arif chose to keep the app's 6 / 12 / 18 ton sizes.
- Saudi PDPL (personal data law, enforced since September 2024) applies to names, phones, and addresses: collect only what is needed, protect it, and allow deletion. So the public APIs return as little personal data as possible.

## Key decisions (Arif confirmed these on 2026-11-22)

| Topic | Decision | Why |
|---|---|---|
| Supplier approval | Every supplier has `approval_status`: `pending`, `approved`, or `rejected`. New suppliers start `pending`. Customers see and can order from `approved` suppliers only. Arif changes the status with `backend/scripts/approve_supplier.py`. | Arif wants to check each supplier before customers see them. A small script is simpler and safer than an admin web page in v1. |
| Verified badge | Merged into approval. There is no separate `is_verified` field. The badge shows on every supplier the customer sees. | Customers only ever see approved suppliers, so a second "verified" flag would always be true for them and would only add confusion. |
| Cities and districts | A fixed config list in backend code (`cities.py`): Riyadh, Jeddah, Dammam, and their 10 districts. Served by `GET /api/cities`. The database stores the city id and district id as text. | The list is small and changes rarely, there is no admin page to edit it, and it must exist even when the database is empty (suppliers need it to register). Arif adds cities by editing that one file. |
| City / district ids | Stable English slugs (`riyadh`, `al-narjis`). Arabic names only in the config. | Renaming an Arabic label never breaks saved data. |
| Supplier auth | Phone + password. Login returns a random token (opaque, not JWT). The database stores only a SHA-256 hash of the token in a `sessions` table. The token lasts 30 days. The frontend sends `Authorization: Bearer <token>`. | Easy to read and test, logout really deletes the session, no signing secret to manage. |
| Password storage | A slow hash (bcrypt, or PBKDF2 from Python's standard library). Never plain text. | Basic safety. |
| Token in the browser | `localStorage` key `mooyah_supplier_token`. | Frontend and backend are on different ports or hosts, so cookies need extra CORS and SameSite setup. Risk: an XSS bug could read the token, so React must never render raw HTML. |
| Customer auth | None. The order reference is the secret. It is random: `MW-` + 8 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`. | Ordering water must stay fast. A random reference cannot be guessed. |
| Pricing | Each supplier sets one price for each size (6, 12, 18 ton) and one extra amount for drinking water (the register form starts at 30). Price = size price + (drinking ? extra : 0). Whole SAR, VAT included. The server computes the final price and saves it on the order. | This is "price per capacity" with no hidden formula. The old formula `getPrice` is removed. |
| Status updates | The tracking page and the dashboard check the API again every 20 to 30 seconds. No WebSockets. | Simple and enough for v1. |
| Payment | No online payment. `cash` (نقداً عند الاستلام) or `card` (شبكة / مدى عند الاستلام, paid to the driver). | Payment processing is out of scope. |
| Migrations | SQLAlchemy 2 models + Alembic migrations. `alembic upgrade head` creates every table on a fresh SQLite or PostgreSQL database. | One clear way to create and change the schema. |
| Abuse protection | No rate limit and no captcha in v1. | Arif's choice for a first deploy. **Add rate limiting on login, register, and order creation before a public launch.** |
| Password reset | None in v1. | No SMS in v1. Arif can add a small backend command later. |

## Features

| # | Feature | Priority |
|---|---|---|
| F1 | List cities and districts from the API | Must |
| F2 | Supplier registration page (new page) | Must |
| F3 | Supplier login and logout | Must |
| F4 | Customer sees approved, available suppliers in the chosen city (Home and Order step 3) | Must |
| F5 | Customer places an order (existing 4-step form + customer name and phone) | Must |
| F6 | Customer tracks an order by reference | Must |
| F7 | Customer cancels an order before the tanker leaves | Must |
| F8 | Supplier dashboard: incoming orders, accept or reject | Must |
| F9 | Supplier dashboard: active deliveries, confirm delivery | Must |
| F10 | Supplier availability on/off | Must |
| F11 | Empty states everywhere there is no data | Must |
| F12 | Database schema by migrations, PostgreSQL in production, SQLite locally | Must |
| F13 | Optional demo seed script, run only by hand | Must |
| F14 | Supplier approval by Arif (command-line script) and approval status on the dashboard | Must |
| F15 | Supplier dashboard: "on the way" and "arrived" steps | Should |
| F16 | Supplier stats: today's numbers and last 7 days revenue chart | Should |
| F17 | Supplier edits own prices, ETA, and profile | Should |
| F18 | Supplier order history (last 50) | Should |
| F19 | Health check endpoint for deploys | Should |
| F20 | Ratings and reviews | Later |
| F21 | Supplier chooses which districts they serve | Later |
| F22 | Admin web page (approve suppliers, reset passwords) | Later |
| F23 | Forgot password by SMS, SMS or push notifications | Later |
| F24 | Real maps / GPS / distance | Later |
| F25 | Online payment | Later |
| F26 | Rate limiting on login, register, and order creation (needed before a public launch) | Later |

## User stories and acceptance checks

**F1. Cities.** As a customer, I want to pick my city and district from a list, so that the order goes to the right place.
- The city selects on Home and Order step 1 show the cities from `GET /api/cities`. No city list is left in the frontend code.
- Changing the city on Order step 1 resets the district to the first district of the new city.

**F2. Supplier registration.** As a supplier, I want to register myself, so that customers in my city can order from me after approval.
- A new page at `#/supplier/register` has fields: name, tagline (optional), phone, password, city, driver name (optional), typical arrival time in minutes, price for 6, 12, and 18 ton, drinking water extra (starts at 30).
- After a valid submit, the supplier is logged in and lands on `#/dashboard` with `approval_status = "pending"`. The supplier does **not** show in `GET /api/suppliers?city_id=<city>` yet.
- Registering a phone that already exists shows an Arabic error under the phone field (`phone_taken`).
- "انضم كمورد" buttons (Home hero, partner banner, footer) open this page.

**F3. Login and logout.** As a supplier, I want to log in with my phone and password, so that only I manage my orders.
- A new page at `#/supplier/login`. "الدخول كمورد" in the login modal and "لوحة المورد" in the footer go to `#/dashboard`, which shows the login page when there is no valid token.
- A wrong phone or password shows "رقم الجوال أو كلمة المرور غير صحيحة" and no token is saved.
- Logout removes the token from `localStorage`, calls the API, and returns to Home. Any API answer `401` also clears the token and shows the login page.
- Pending and rejected suppliers can log in too (they see their approval status, see F14).

**F4. Suppliers in my city.** As a customer, I want to see real suppliers in my city with their prices, so that I can choose.
- Home "موردون قريبون منك" shows up to 3 suppliers from the API for the selected city, priced for 6 ton.
- Order step 3 shows all approved, available suppliers in the order's city, priced for the chosen size and water type.
- With no suppliers, Home and Order step 3 show an Arabic empty state (for example "لا يوجد موردون متاحون في الرياض حالياً") and a "انضم كمورد" link. The customer cannot go past step 3 without a supplier.

**F5. Place an order.** As a customer, I want to confirm my order, so that a supplier delivers water to me.
- Step 1 gets two new required fields: customer name and mobile number (`05` + 8 digits).
- Confirm sends `POST /api/orders`. On `201`, the app saves the reference in `localStorage` (`mooyah_last_order`) and opens `#/tracking?ref=<reference>`.
- The price on the summary and on the tracking page equals the price the server returns. A "later" time in the past is refused with an Arabic message.

**F6. Track an order.** As a customer, I want to open my order with its reference, so that I see its status.
- `#/tracking?ref=MW-XXXXXXXX` loads the order from the API. Refreshing the page keeps the order.
- `#/tracking` with no `ref` uses `mooyah_last_order`. With none, it shows the existing empty state plus a small "رقم الطلب" input.
- An unknown reference shows "ما لقينا طلب بهذا الرقم". The "محاكاة" (simulate) button is removed. The status changes only when the supplier changes it.

**F7. Cancel.** As a customer, I want to cancel my order before the tanker leaves, so that I am not charged.
- The cancel button shows only when the status is `pending` or `accepted`.
- After cancel, the page shows "تم إلغاء الطلب" and "اطلب مرة ثانية".
- Cancelling an order that is already `on_the_way` returns `409 cannot_cancel` and the page shows the error.

**F8. Incoming orders.** As a supplier, I want to accept or reject new orders, so that I only take the work I can do.
- "الطلبات الواردة" lists my `pending` orders with customer name, district, size, price, and time ("في أقرب وقت" or the scheduled date).
- Accept moves the order to "التوصيلات النشطة". Reject moves it to history as "مرفوض". The customer's tracking page shows the new status on its next refresh.
- The accept button is disabled while I am unavailable (same as today).

**F9. Active deliveries.** As a supplier, I want to confirm delivery, so that the order is closed and counted in my revenue.
- Each active order shows the customer phone (a `tel:` link), address, and notes.
- "تأكيد التسليم" sets the status to `delivered`. The order moves to history as "مكتمل".

**F10. Availability.** As a supplier, I want to turn new orders off, so that customers do not pick me when I am busy.
- The toggle calls `PATCH /api/me` with `is_available`. After a page refresh it keeps its value.
- An unavailable supplier does not appear in `GET /api/suppliers`. Creating an order for them returns `409 supplier_unavailable`.

**F11. Empty states.** As a first visitor on an empty database, I want clear messages, so that the app does not look broken.
- With an empty database, Home, Order step 3, Tracking, and every dashboard panel show Arabic empty states and no errors.
- If the API is down, the page shows "تعذر الاتصال بالخادم، حاول مرة ثانية" and a retry button.

**F12. Database.** As Arif, I want to create the database on a fresh server with one command, so that deploying is easy.
- `alembic upgrade head` creates all tables on an empty PostgreSQL database and on an empty SQLite file.
- The app reads `DATABASE_URL` from the environment. With no value it uses `sqlite:///./local.db`.

**F13. Demo seed.** As Arif, I want to fill a demo database by hand, so that I can show the app.
- The script `backend/scripts/seed_demo.py` (run from `backend/` with `python -m scripts.seed_demo`) adds the 4 suppliers from the old mock file, **already `approved`**, with the demo password printed on screen, and a few orders in different statuses.
- It never runs on app start or in migrations. It stops with a message if suppliers already exist.

**F14. Supplier approval.** As Arif, I want to approve or reject new suppliers from the command line, so that customers only see suppliers I checked.
- The script `backend/scripts/approve_supplier.py` (run from `backend/`, uses the same `DATABASE_URL`):
  - `python -m scripts.approve_supplier --list-pending` prints id, name, phone, city, and register date of every `pending` supplier, oldest first, or "No pending suppliers."
  - `python -m scripts.approve_supplier --phone 05XXXXXXXX` sets `approved` and prints "Approved: <name> (<phone>)".
  - `python -m scripts.approve_supplier --phone 05XXXXXXXX --reject` sets `rejected` and prints "Rejected: <name> (<phone>)".
  - An unknown or badly formed phone prints a clear error and exits with code 1. Running it again on any supplier simply sets the new status.
- A `pending` supplier sees on the dashboard: "حسابك قيد المراجعة. بتظهر للعملاء بعد موافقة فريق موية." A `rejected` supplier sees: "لم تتم الموافقة على حسابك. تواصل مع فريق موية." Both see empty order panels and can still edit their profile and availability.
- After approval, the supplier shows in `GET /api/suppliers` (if available) and can receive orders. A non-approved supplier never appears there, and `POST /api/orders` for them returns `409 supplier_unavailable`.

**F15 to F19 (Should).**
- F15: an active order shows "في الطريق" when `accepted`, "وصلت" when `on_the_way`, and "تأكيد التسليم" always.
- F16: the four stat cards and the weekly chart use `GET /api/me/stats`. The rating card becomes "إجمالي الطلبات المكتملة".
- F17: a small "بياناتي وأسعاري" panel in the dashboard edits name, tagline, driver name, arrival time, prices, and drinking extra.
- F18: "سجل الطلبات" shows the last 50 `delivered`, `rejected`, and `cancelled` orders.
- F19: `GET /api/health` returns `{"status": "ok"}` when the database answers.

## Data model

All times are saved in UTC. Money is a whole number of SAR (VAT included).

**`suppliers`**

| Field | Type | Empty? | Notes |
|---|---|---|---|
| id | integer, PK | no | |
| name | text (2-60) | no | Shown on cards. |
| tagline | text (max 80) | yes | Card subtitle. |
| phone | text, unique | no | `05XXXXXXXX`. Login name. |
| password_hash | text | no | Never returned by the API. |
| city_id | text | no | Must be in the city config. Not editable in v1. |
| driver_name | text (max 60) | yes | Shown on tracking. |
| eta_minutes | integer (10-240) | no | Typical arrival time. |
| price_6_sar | integer (1-5000) | no | |
| price_12_sar | integer (1-5000) | no | |
| price_18_sar | integer (1-5000) | no | |
| drinking_extra_sar | integer (0-1000) | no | Extra for drinking water. |
| is_available | boolean | no | Default `true`. The supplier's own switch. |
| approval_status | text | no | `pending`, `approved`, or `rejected`. Default `pending`. Changed only by `approve_supplier.py` (or the seed). |
| created_at, updated_at | timestamp | no | |

A supplier is visible to customers only when `approval_status = 'approved'` **and** `is_available = true`.

**`sessions`**

| Field | Type | Empty? | Notes |
|---|---|---|---|
| id | integer, PK | no | |
| supplier_id | integer, FK suppliers | no | |
| token_hash | text, unique | no | SHA-256 of the token. |
| created_at | timestamp | no | |
| expires_at | timestamp | no | created_at + 30 days. |

**`orders`**

| Field | Type | Empty? | Notes |
|---|---|---|---|
| id | integer, PK | no | Internal only. |
| reference | text, unique | no | `MW-XXXXXXXX`. Used in every URL. |
| supplier_id | integer, FK suppliers | no | |
| customer_name | text (2-60) | no | |
| customer_phone | text | no | `05XXXXXXXX`. Only the supplier of the order sees it. |
| city_id, district_id | text | no | Must match the config. |
| address | text (8-200) | no | |
| capacity_tons | integer | no | 6, 12, or 18. |
| water_type | text | no | `regular` or `drinking`. |
| delivery_time | text | no | `asap` or `scheduled`. |
| scheduled_at | timestamp | yes | Required when `scheduled`. |
| notes | text (max 300) | yes | |
| payment_method | text | no | `cash` or `card`. |
| price_sar | integer | no | Saved when the order is created. Never changes. |
| status | text | no | See the status list in the API contract. |
| delivered_at | timestamp | yes | Set when `delivered`. Used for revenue. |
| created_at, updated_at | timestamp | no | |

Indexes: `orders(supplier_id, status)`, `orders(reference)`, `suppliers(city_id, approval_status, is_available)`.

If Arif rejects a supplier who already has open orders, those orders stay as they are; the supplier can still finish them.

## Changes to Arif's frontend (keep the look; change only what is needed)

- `source/` is read only. The Frontend Developer copies it into `frontend/` and works there. The backend lives in `backend/`.
- Delete `src/data/mock.js`. Add one small API client file (for example `src/api.js`) that reads `VITE_API_BASE_URL`.
- Supplier cards: hide the distance (no GPS). Show the rating line as "مورد جديد" when there is no rating, and the count from `delivered_orders_count`. Keep the verified badge on every card (every listed supplier is approved). The card color comes from the supplier id (for example `id % 3`).
- Dashboard: show the approval banner from F14 under the heading when `approval_status` is not `approved`.
- Remove fake numbers and fake claims: hero "أكثر من ٢,٥٠٠ عميل", "بيانات تجريبية" notes, the plate number "أ ب ج ٤٢١٧", the fixed name "عبدالله" and "مياه النقاء" in the dashboard, and the hard-coded weekly chart.
- Update the texts that are no longer true: the privacy modal (data is now sent to the server), the FAQ, the login modal, "طلب تجريبي" tags, the "تأكيد طلبك التجريبي" toast, and the payment notice.
- Footer: "نسخة تجريبية" becomes "نسخة أولى".
- The "اتصال بالسائق" button becomes a `tel:` link with the supplier phone once the order is accepted. Before that it is disabled.
- `MapPreview` stays as a decorative picture. Do not show a fake countdown: show the supplier's `eta_minutes` range, or "الوايت عند موقعك" when `arrived`.
- Update or replace the Playwright tests in `tests/`, because they expect mock data.
- The dev server runs on port 5200.

## Special needs

- **Arabic and right to left.** Every new page (register, login, order reference input, approval banner, empty states, error messages) uses `dir="rtl"` from the existing layout, Arabic labels, the existing fonts, buttons, and form styles. Arrows keep today's direction (arrow left means "next").
- **Phone and number inputs** use `dir="ltr"` and `inputmode="numeric"`. The frontend turns Arabic-Indic digits (٠-٩) into 0-9 and removes spaces before sending.
- **Mobile first.** New pages must work at 360 px wide with no side scroll, like the existing pages.
- **Time zone.** Show dates in Arabic (`ar-SA`). "Today" in the stats means the Asia/Riyadh day (UTC+3).
- **Privacy (PDPL).** Public endpoints never return a customer phone or a supplier password hash. The supplier phone is shown to the customer only after the supplier accepts. No analytics or third-party trackers.
- **Clear code.** Small files, clear names, short comments where the reason is not obvious. Arif will read and extend this code.

## Deploy notes

- Backend env vars (in `backend/.env.example`): `DATABASE_URL` (for example `postgresql+psycopg://user:pass@host:5432/mooyah`), `CORS_ORIGINS` (comma list, default `http://127.0.0.1:5200,http://localhost:5200`).
- Frontend env var (in `frontend/.env.example`): `VITE_API_BASE_URL` (default `http://127.0.0.1:8100`).
- Steps on a fresh server: install requirements, set `DATABASE_URL`, run `alembic upgrade head`, start `uvicorn app.main:app --host 0.0.0.0 --port 8100`. Build the frontend with `npm run build` and serve `dist/` as static files.
- To approve suppliers on the server: `python -m scripts.approve_supplier --list-pending`, then `--phone <phone>`.
- Use HTTPS in production (passwords and tokens travel in requests).
- SQLite is for local runs only. Never run the seed script on production.
- **Before a public launch:** add rate limiting on login, register, and order creation (F26).
- Both `backend/README.md` and `frontend/README.md` explain local run, tests, approval, and deploy in a few lines.

## Out of scope (v1)

- Online payment, real maps, GPS, distance, SMS, push notifications, email.
- Ratings and reviews, supplier district choice, automatic order reassignment or timeouts.
- Admin web page, password reset, phone or city change for a supplier.
- Customer accounts and order history for customers.
- Rate limiting and captcha (needed before a public launch).
- English language version.

## Questions for Arif

All 7 questions were answered by Arif on 2026-11-22:

1. New suppliers are **not** visible until Arif approves them (`approval_status`, approval script). The verified badge is merged into approval.
2. Keep 3 cities and 10 districts in `cities.py`.
3. Keep 6 / 12 / 18 ton.
4. Each supplier sets the drinking water extra; the register form starts at 30.
5. No rate limit or captcha in v1; add it before a public launch.
6. Footer label becomes "نسخة أولى".
7. No password reset in v1.

No open questions remain.
