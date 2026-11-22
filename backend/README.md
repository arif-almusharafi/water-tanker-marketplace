# Mooyah backend (FastAPI). Run every command from `backend/`.

Install: `python -m venv .venv` then `.venv\Scripts\pip install -r requirements.txt` (Linux: `.venv/bin/pip`).
Local run (SQLite `local.db`): `.venv\Scripts\alembic upgrade head` then `.venv\Scripts\uvicorn app.main:app --port 8100`.
Tests: `.venv\Scripts\python -m pytest`
Demo data (empty database only, never on production): `.venv\Scripts\python -m scripts.seed_demo`
Approve suppliers: `python -m scripts.approve_supplier --list-pending`, then `--phone 05XXXXXXXX` (add `--reject` to reject).
Deploy (PostgreSQL): install requirements, copy `.env.example` to `backend/.env` (or set real env vars; they win) with `DATABASE_URL` and `CORS_ORIGINS`,
run `alembic upgrade head`, start `uvicorn app.main:app --host 0.0.0.0 --port 8100` behind HTTPS. Check the startup line `Database: postgresql ...`.
Before a public launch: add rate limiting on login, register, and order creation.
Settings: see `.env.example`. API: `../docs/api-contract.md`.
