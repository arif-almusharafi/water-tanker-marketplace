"""Settings read from environment variables (see .env.example).

If backend/.env exists, its values are loaded first. Real environment
variables win over the file.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")  # does nothing when the file is missing

# SQLite is for local runs only. Production uses PostgreSQL, for example
# postgresql+psycopg://user:pass@host:5432/mooyah
DATABASE_URL = os.environ.get("DATABASE_URL") or "sqlite:///./local.db"

CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://127.0.0.1:5200,http://localhost:5200"
    ).split(",")
    if origin.strip()
]
