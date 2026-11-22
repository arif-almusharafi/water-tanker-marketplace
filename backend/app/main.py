"""The FastAPI app. Run: uvicorn app.main:app --port 8100"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS, DATABASE_URL
from app.db import describe_database
from app.errors import add_error_handlers
from app.routes import auth, me, orders, public

# uvicorn prints INFO lines of this logger, so the database line shows at startup.
logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Database: %s", describe_database(DATABASE_URL))
    yield


app = FastAPI(title="Mooyah API", lifespan=lifespan)

# Error handlers first: the CORS middleware added after them wraps them,
# so error answers also get CORS headers.
add_error_handlers(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(public.router)
app.include_router(orders.router)
app.include_router(auth.router)
app.include_router(me.router)
