import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.i18n import LocaleMiddleware
from app.api.v1.endpoints import (
    auth,
    dashboard,
    employees,
    logs,
    geofences,
    users,
    roles,
    audit,
    i18n,
    face,
    avatar,
    ws,
)

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Store reference to the event loop for sync-safe WS broadcasts
    import asyncio
    from app.services.ws_manager import manager as ws_manager
    ws_manager.set_loop(asyncio.get_running_loop())

    # Ensure avatar_glb_url column exists on employees table (for existing DBs)
    from sqlalchemy import text, inspect as sa_inspect
    from app.db.base import engine
    with engine.connect() as conn:
        inspector = sa_inspect(engine)
        columns = [c["name"] for c in inspector.get_columns("employees")]
        if "avatar_glb_url" not in columns:
            conn.execute(text("ALTER TABLE employees ADD COLUMN avatar_glb_url VARCHAR(500)"))
            conn.commit()
        if "gender" not in columns:
            conn.execute(text("ALTER TABLE employees ADD COLUMN gender VARCHAR(10)"))
            conn.commit()
    yield

app = FastAPI(
    title="Siddhan Employee Logs API",
    description="Siddhan Employee Logs - Face-based Check-in / Check-out Management System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS — allow all origins in dev (needed for WebView model-viewer fetch)
cors_origins = settings.cors_origins
if cors_origins == ["*"]:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Locale middleware (raw ASGI — WebSocket-safe)
app.add_middleware(LocaleMiddleware)

# API routers
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(employees.router, prefix=API_PREFIX)
app.include_router(logs.router, prefix=API_PREFIX)
app.include_router(geofences.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(roles.router, prefix=API_PREFIX)
app.include_router(audit.router, prefix=API_PREFIX)
app.include_router(i18n.router, prefix=API_PREFIX)
app.include_router(face.router, prefix=API_PREFIX)
app.include_router(avatar.router, prefix=API_PREFIX)
app.include_router(ws.router, prefix=API_PREFIX)

# Serve uploaded face images
import os
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/")
def root():
    return {"message": "Siddhan Employee Logs API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
