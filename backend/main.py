import sys
import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware

from config import settings
from database import init_db, SessionLocal
from utils.limiter import limiter
from routers import (
    auth_router,
    resume_router,
    roadmaps_router,
    jobs_router,
    dsa_router,
    comms_router,
    tracker_router,
    mentor_router,
    agents_router,
    admin_router,
)

# Ensure encoding for stdio
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    print("STARTUP: Running startup tasks...")
    try:
        init_db()
        print("SUCCESS: Database initialized")
    except Exception as e:
        print(f"ERROR: Database initialization failed: {e}")

    # Initialize multi-agent team
    try:
        import services.llm_service as llm_svc
        from agents import get_team

        team = get_team()
        team.configure(llm_svc, SessionLocal)
        print(
            "SUCCESS: Agent team initialized — "
            + ", ".join(a["emoji"] + " " + a["name"] for a in team.all_agents_info())
        )
    except Exception as e:
        print(f"WARNING: Agent team init failed (non-fatal): {e}")

    yield

    print("SHUTDOWN: Shutting down...")


# App instantiation
app = FastAPI(title="Smart Resume Analyzer", version="2.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Global Exception Handler for Debugging
@app.exception_handler(Exception)
async def debug_exception_handler(request: Request, exc: Exception):
    import traceback

    error_msg = traceback.format_exc()
    logger.exception("CRITICAL ERROR processing %s", request.url)
    try:
        log_path = Path(__file__).resolve().parent / "critical_error.log"
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"Error processing {request.url}\n{error_msg}\n\n")
    except Exception:
        pass
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=settings.ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(roadmaps_router)
app.include_router(jobs_router)
app.include_router(dsa_router)
app.include_router(comms_router)
app.include_router(tracker_router)
app.include_router(mentor_router)
app.include_router(agents_router)
app.include_router(admin_router)


# ==================== SYSTEM HEALTH ====================


@app.get("/health")
async def health_check():
    """Returns the status of the API and configured services."""
    from services.llm_service import GEMINI_CONFIGURED, GROQ_CLIENT

    status = {
        "status": "online",
        "version": "2.0",
        "environment": "production" if os.getenv("RAILWAY_ENVIRONMENT") else "development",
        "database": "connected",
        "llm_config": {
            "provider_primary": settings.LLM_PROVIDER,
            "groq_configured": GROQ_CLIENT is not None,
            "gemini_configured": GEMINI_CONFIGURED,
        },
    }

    # Test DB
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
    except Exception as e:
        status["database"] = f"error: {str(e)}"
        status["status"] = "degraded"

    return status


# ==================== FRONTEND FALLBACK (SPA) ====================

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    app.mount(
        "/static",
        StaticFiles(directory=str(FRONTEND_DIST), html=False),
        name="static",
    )
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST), html=False), name="assets")


@app.get("/")
async def serve_index():
    """Serve specific index.html or fallback to API status."""
    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"status": "online", "service": "SmartResume API", "docs": "/docs", "health": "/health"}


@app.get("/{full_path:path}")
async def serve_spa_or_static(full_path: str):
    """
    Serve static files from root if they exist,
    otherwise return index.html for client-side routing.
    """
    if full_path.startswith(("api/", "docs", "redoc", "openapi.json")):
        raise HTTPException(status_code=404, detail="Not found")

    file_path = FRONTEND_DIST / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)

    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="Not found")


# ==================== RUN SERVER ====================

if __name__ == "__main__":
    import uvicorn

    print("=" * 50)
    print("Starting SmartResume Backend Server")
    print("=" * 50)
    print("Backend API: http://localhost:8000")
    print("API Docs: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("=" * 50)
    print("\nStarting server... Press CTRL+C to stop\n")

    uvicorn.run(app, host="0.0.0.0", port=8000)
