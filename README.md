# موية — Water Tanker Marketplace

An Arabic, RTL web app for a Saudi water-tanker delivery marketplace. Customers compare local suppliers, book a tanker, and track their order until delivery. Suppliers register themselves, are approved by the owner, and manage their orders from a supplier dashboard.

The React frontend talks to a FastAPI backend. All data is real and saved in a database: PostgreSQL in production, SQLite for local runs. The app has no mock data; a new database starts empty.

## Run locally

Requires Python 3 (tested with 3.13), Node.js 20.19+ or 22.12+, and npm.
On Windows PowerShell with restricted script execution, use `npm.cmd` instead of `npm`.

**1. Backend** (from `backend/`, runs on http://127.0.0.1:8100):

```sh
python -m venv .venv
.venv/bin/pip install -r requirements.txt      # Windows: .venv\Scripts\pip
.venv/bin/alembic upgrade head                 # creates the local SQLite file local.db
.venv/bin/uvicorn app.main:app --port 8100
```

For a local run, do not create `backend/.env`: with no `DATABASE_URL` the app uses `sqlite:///./local.db`.

**2. Frontend** (from `frontend/`, runs on http://127.0.0.1:5200):

```sh
npm install
npm run dev
```

The frontend calls `http://127.0.0.1:8100` by default. To change it, copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.

More details (tests, settings, deploy) are in [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).

```sh
# backend/
.venv/bin/python -m pytest

# frontend/
npm run build
npm run lint
npm test
```

Browser tests use the installed Microsoft Edge browser in headless mode and a fake API inside `tests/fake-api.js`, so they do not need the backend. Run `npm test` to check booking, pricing, tracking, supplier actions, mobile navigation, and responsive overflow.

### Optional demo data

The database starts empty. To show the app with some data, run this by hand on an **empty local** database (never on production):

```sh
# backend/
.venv/bin/python -m scripts.seed_demo
```

It adds 4 approved demo suppliers and a few orders in different statuses, and prints the demo password. It stops if suppliers already exist. It never runs on its own.

### Approving suppliers

New suppliers register at `#/supplier/register`. They can log in at once, but customers do not see them until the owner approves them:

```sh
# backend/
.venv/bin/python -m scripts.approve_supplier --list-pending
.venv/bin/python -m scripts.approve_supplier --phone 05XXXXXXXX            # approve
.venv/bin/python -m scripts.approve_supplier --phone 05XXXXXXXX --reject   # reject
```

## Features

- Responsive Arabic landing page with an original SVG tanker illustration, benefits, real supplier cards for the chosen city, and city selection.
- Four-step order flow: address and contact, capacity/water/scheduling, supplier choice, summary and payment choice (cash or card on delivery).
- Pricing per capacity: each supplier sets a price for 6, 12, and 18 ton and an extra for drinking water. The server computes the final price.
- Required address and phone, future schedule validation, and a random order reference (`MW-XXXXXXXX`).
- Order tracking by reference: delivery timeline that updates by itself, supplier and driver details, a call link once the supplier accepts, and cancellation before the tanker leaves.
- Supplier registration and login (phone + password). New suppliers stay hidden until the owner approves them with `backend/scripts/approve_supplier.py`; the dashboard shows the approval status.
- Supplier dashboard with availability, accept/reject actions, active deliveries ("on the way", "arrived", "delivered"), today's totals, order history, weekly revenue chart, and a profile and prices panel.
- Clear Arabic empty states when there are no suppliers or orders, and a retry message when the server cannot be reached.
- Working hash navigation, mobile menu, informational dialogs, and status notifications.
- Database schema by Alembic migrations: `alembic upgrade head` creates every table on a fresh PostgreSQL or SQLite database.
- Lucide icons and reusable UI components. The Arabic font loads from Google Fonts with system fallbacks; no API keys.

## Tech stack

| Part | Tools |
|---|---|
| Frontend | React 19, Vite, JavaScript, Lucide React, CSS, Playwright, ESLint |
| Backend | Python, FastAPI, SQLAlchemy 2, Alembic, Pydantic, Uvicorn, pytest |
| Database | PostgreSQL in production (psycopg 3), SQLite for local runs |

## Structure

```text
frontend/
  public/favicon.svg
  src/
    api.js                  # Every call to the backend
    components/             # Shared buttons, cards, dialogs, form fields, map placeholder
      dashboard/            # Supplier dashboard panels
      order/                # The four order steps
    lib/                    # Small helpers (labels, formatting, validation, polling)
    pages/
      Home.jsx
      Order.jsx
      Tracking.jsx
      Dashboard.jsx
      SupplierRegister.jsx
      SupplierLogin.jsx
    App.jsx                 # Hash navigation and session state
    main.jsx
    styles.css
  tests/                    # Playwright tests with a fake API
  .env.example
backend/
  app/
    main.py                 # FastAPI app
    routes/                 # public, orders, auth, me (logged-in supplier)
    models.py               # Database tables
    schemas.py              # Request and response shapes
    cities.py               # Fixed list of cities and districts
    config.py, db.py, security.py, errors.py, ...
  alembic/                  # Database migrations
  scripts/
    seed_demo.py            # Optional demo data, run by hand
    approve_supplier.py     # Approve or reject suppliers
  tests/                    # pytest tests
  .env.example
README.md
```

## Deploy

- Backend: set `DATABASE_URL` (PostgreSQL) and `CORS_ORIGINS` as environment variables or in `backend/.env` (see `backend/.env.example`), run `alembic upgrade head`, then start `uvicorn app.main:app --host 0.0.0.0 --port 8100` behind HTTPS. The startup log shows which database is in use.
- Frontend: set `VITE_API_BASE_URL` to the backend address, run `npm run build`, and serve the `dist/` folder as static files.
- Use HTTPS in production, because passwords and login tokens are sent in requests.

## Not in v1 / before public launch

This is a first version (نسخة أولى). Before a public launch:

- **Rate limiting** on login, register, and order creation (no limit or captcha today).
- **Password reset**: a supplier who forgets the password cannot reset it yet.
- **Same-moment status changes**: if a customer cancels at the same moment the supplier changes the status, both can succeed. The fix is a conditional update that returns `409` to the second request.
- **Old login sessions** are never deleted from the database. Harmless at small scale; clean expired sessions when a new one is created.

Not in v1 at all:

- Online payment (only cash or card paid to the driver on delivery).
- Real maps, GPS, and distance. The map is a visual placeholder.
- SMS, push, or email notifications. Pages check for updates every 20 to 30 seconds.
- Ratings and reviews, supplier choice of districts, an admin web page, customer accounts, and an English version.
