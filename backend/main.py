from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from typing import Optional
from pathlib import Path
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import logging
import sys
import os
import httpx
import hashlib
from urllib.parse import urlencode, urlparse

# ── Simple in-memory LLM response cache ────────────────────────────────────────
# Prevents redundant API calls for identical resume+role+company combos.
_LLM_CACHE: dict = {}
MAX_CACHE_SIZE = 200

def _cache_key(*args: str) -> str:
    combined = "|".join(str(a)[:500] for a in args)
    return hashlib.md5(combined.encode()).hexdigest()

def _get_cached(key: str):
    return _LLM_CACHE.get(key)

def _set_cached(key: str, value):
    if len(_LLM_CACHE) >= MAX_CACHE_SIZE:
        # Evict oldest entry
        oldest = next(iter(_LLM_CACHE))
        del _LLM_CACHE[oldest]
    _LLM_CACHE[key] = value

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from parser_module import extract_text_from_pdfbytes
from scorer_final import score_resume, GENERAL_JD_TEXT
from contextlib import asynccontextmanager
from database import (
    get_db, User, Analysis, GitHubProfile,
    CodingRoadmap, JobApplication, DSATrack, ResumeProfile, MentorConversation, LLMCallLog, DailyLog,
    AgentConversation, AgentTrace, SessionLocal, init_db
)
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from config import settings
from security_utils import create_signed_state, decode_signed_state, decrypt_resume_text, encrypt_resume_text

logger = logging.getLogger(__name__)

MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024
UPLOAD_CHUNK_SIZE = 1024 * 1024
RESUME_PREVIEW_LIMIT = 200


def build_resume_preview(resume_text: str, limit: int = RESUME_PREVIEW_LIMIT) -> str:
    cleaned = (resume_text or "").strip()
    return cleaned[:limit]


def get_analysis_resume_text(analysis: Optional[Analysis]) -> str:
    if not analysis:
        return ""
    decrypted = decrypt_resume_text(analysis.resume_text)
    return (decrypted or analysis.resume_preview or "").strip()


def get_analysis_resume_preview(analysis: Optional[Analysis], limit: int = RESUME_PREVIEW_LIMIT) -> str:
    if not analysis:
        return ""
    preview = (analysis.resume_preview or "").strip()
    if preview:
        return preview[:limit]
    return build_resume_preview(get_analysis_resume_text(analysis), limit=limit)


def builder_content_to_resume_text(content: Optional[dict]) -> str:
    if not isinstance(content, dict):
        return ""

    personal = content.get("personal") or {}
    skills = content.get("skills") or {}
    sections = []

    name = (personal.get("name") or "").strip()
    contact = [
        (personal.get("email") or "").strip(),
        (personal.get("phone") or "").strip(),
        (personal.get("linkedin") or "").strip(),
        (personal.get("github") or "").strip(),
    ]
    if name:
        sections.append(name)
    if any(contact):
        sections.append(" | ".join([value for value in contact if value]))

    summary = (content.get("summary") or "").strip()
    if summary:
        sections.append(f"SUMMARY\n{summary}")

    experience_rows = []
    for row in content.get("experience") or []:
        if not isinstance(row, dict):
            continue
        header_parts = [
            (row.get("company") or "").strip(),
            (row.get("title") or "").strip(),
            " - ".join([part for part in [(row.get("startDate") or "").strip(), (row.get("endDate") or "").strip()] if part]),
        ]
        bullets = "\n".join(
            f"- {line.strip().lstrip('-* ')}"
            for line in (row.get("description") or "").splitlines()
            if line.strip()
        )
        block = "\n".join([part for part in header_parts if part])
        if bullets:
            block = f"{block}\n{bullets}" if block else bullets
        if block:
            experience_rows.append(block)
    if experience_rows:
        sections.append("EXPERIENCE\n" + "\n\n".join(experience_rows))

    education_rows = []
    for row in content.get("education") or []:
        if not isinstance(row, dict):
            continue
        block = " | ".join(
            [part for part in [(row.get("school") or "").strip(), (row.get("degree") or "").strip(), (row.get("year") or "").strip()] if part]
        )
        if block:
            education_rows.append(block)
    if education_rows:
        sections.append("EDUCATION\n" + "\n".join(education_rows))

    project_rows = []
    for row in content.get("projects") or []:
        if not isinstance(row, dict):
            continue
        title = " | ".join([part for part in [(row.get("name") or "").strip(), (row.get("technologies") or "").strip()] if part])
        bullets = "\n".join(
            f"- {line.strip().lstrip('-* ')}"
            for line in (row.get("description") or "").splitlines()
            if line.strip()
        )
        block = f"{title}\n{bullets}" if title and bullets else (title or bullets)
        if block:
            project_rows.append(block)
    if project_rows:
        sections.append("PROJECTS\n" + "\n\n".join(project_rows))

    skill_parts = []
    for label, value in [("Languages", skills.get("languages")), ("Frameworks", skills.get("frameworks")), ("Tools", skills.get("tools"))]:
        cleaned = (value or "").strip()
        if cleaned:
            skill_parts.append(f"{label}: {cleaned}")
    if skill_parts:
        sections.append("SKILLS\n" + "\n".join(skill_parts))

    return "\n\n".join(section for section in sections if section).strip()


def log_user_activity(
    db: Session,
    user_id: int,
    category: str,
    count: int = 1,
    note: str = "",
    when: Optional[datetime] = None,
) -> None:
    if not category or count <= 0:
        return

    log_date = (when or datetime.utcnow()).date()
    existing = db.query(DailyLog).filter(
        DailyLog.user_id == user_id,
        DailyLog.category == category,
        DailyLog.log_date == log_date,
    ).first()

    if existing:
        existing.count = (existing.count or 0) + count
        if note:
            existing.note = note[:500]
    else:
        db.add(
            DailyLog(
                user_id=user_id,
                category=category,
                count=count,
                note=note[:500] if note else "",
                log_date=log_date,
            )
        )


def build_user_payload(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "is_admin": settings.is_admin_email(user.email),
    }


def resolve_post_oauth_redirect(redirect_to: Optional[str] = None) -> str:
    default_relative = "/dashboard"
    default_target = settings.FRONTEND_APP_URL or default_relative
    candidate = (redirect_to or default_target).strip()
    if not candidate:
        return default_relative

    parsed = urlparse(candidate)
    if not parsed.scheme and candidate.startswith("/"):
        return candidate

    allowed_origins = set(settings.ALLOWED_ORIGINS)
    if settings.FRONTEND_APP_URL:
        allowed_origins.add(settings.FRONTEND_APP_URL.rstrip("/"))

    origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else ""
    if origin and origin in allowed_origins:
        return candidate

    return default_target

# No external storage client — using local DB only

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and Model
    print("STARTUP: Running startup tasks...")
    try:
        init_db()
        print("SUCCESS: Database initialized")
    except Exception as e:
        print(f"ERROR: Database initialization failed: {e}")

    # Initialize multi-agent team
    try:
        from agents import get_team
        import services.llm_service as llm_svc
        team = get_team()
        team.configure(llm_svc, SessionLocal)
        print("SUCCESS: Agent team initialized — " + ", ".join(a["emoji"] + " " + a["name"] for a in team.all_agents_info()))
    except Exception as e:
        print(f"WARNING: Agent team init failed (non-fatal): {e}")

    yield
    
    # Shutdown logic (if any)
    print("SHUTDOWN: Shutting down...")

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

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
    except:
        pass
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


async def read_upload_with_limit(file: UploadFile, max_size: int = MAX_RESUME_FILE_SIZE) -> bytes:
    """Read an uploaded file in chunks and enforce the server-side size limit."""
    chunks = []
    total_size = 0

    while True:
        chunk = await file.read(UPLOAD_CHUNK_SIZE)
        if not chunk:
            break

        total_size += len(chunk)
        if total_size > max_size:
            raise HTTPException(
                status_code=413,
                detail="Resume PDF must be 10 MB or smaller.",
            )

        chunks.append(chunk)

    return b"".join(chunks)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=settings.ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        }
    }
    
    # Test DB
    try:
        from database import SessionLocal
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
    except Exception as e:
        status["database"] = f"error: {str(e)}"
        status["status"] = "degraded"
        
    return status

# ==================== AUTH ENDPOINTS ====================

@app.post("/signup", summary="Create User Account", description="Registers a new user with a unique email and username. Returns account details on success.")
@limiter.limit("5/minute")
async def signup(
    request: Request,
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    """Register a new user - OPTIMIZED"""
    
    # Validate input
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    
    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    
    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Check if user exists
    existing_email = db.query(User).filter(User.email == email.lower()).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = db.query(User).filter(User.username == username.lower()).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    try:
        # Create new user
        hashed_password = get_password_hash(password)
        new_user = User(
            email=email.lower(),
            username=username.lower(),
            hashed_password=hashed_password
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "success": True,
            "message": "User created successfully",
            "user": build_user_payload(new_user)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@app.post("/login", summary="User Authentication", description="Authenticates a user and returns a JWT access token for subsequent requests.")
@limiter.limit("5/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint - OPTIMIZED"""
    
    try:
        # Find user by email (case-insensitive)
        user = db.query(User).filter(User.email == form_data.username.lower()).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify password
        if not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": build_user_payload(user)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@app.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return build_user_payload(current_user)

# ==================== RESUME ANALYSIS ENDPOINT ====================

@app.post("/analyze", summary="Deep Resume Analysis", description="Uploads a PDF resume and runs it through the hybrid Heuristic + LLM scoring engine for comprehensive 7-dimension scoring with reasoning.")
@app.post("/analyze-resume/", summary="Deep Resume Analysis", description="Alias for /analyze.")
@limiter.limit("5/minute")
async def analyze_resume(
    request: Request,
    file: UploadFile,
    jd: str = Form(""),
    years: float = Form(0.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze resume with hybrid Heuristic + LLM engine."""
    if not file:
        raise HTTPException(status_code=400, detail="Resume PDF is required.")
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        content = await read_upload_with_limit(file)
        resume_text = extract_text_from_pdfbytes(content) or "No text extracted."
        if len(resume_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract meaningful text from PDF")

        jd_text = jd.strip() or GENERAL_JD_TEXT

        # Score resume — scorer handles heuristics + LLM internally
        score_result = score_resume(resume_text, jd_text)

        ats_score = score_result.get("score", 0)
        suggestions = score_result.get("gemini_suggestions", [])

        # Calculate score difference from previous analysis
        prev_analysis = db.query(Analysis).filter(
            Analysis.user_id == current_user.id
        ).order_by(Analysis.created_at.desc()).first()
        score_diff = (ats_score - prev_analysis.ats_score) if prev_analysis else 0
        previous_score = prev_analysis.ats_score if prev_analysis else 0

        resume_preview = build_resume_preview(resume_text)

        # Save to database
        analysis = Analysis(
            user_id=current_user.id,
            resume_text=encrypt_resume_text(resume_text),
            resume_preview=resume_preview,
            jd_used=jd_text[:500] if jd.strip() else None,
            ats_score=int(ats_score),
            score_breakdown=score_result.get("breakdown", {}),
            keyword_gaps=score_result.get("technical_metrics", {}),
            suggestions=suggestions,
            radar_data=score_result.get("radar_data", []),
            role_alignment=score_result.get("role_alignment", {}),
        )
        db.add(analysis)
        log_user_activity(
            db,
            current_user.id,
            "resume",
            note=f"Analyzed resume{' for JD' if jd.strip() else ''}",
        )
        db.commit()

        return {
            "ats_score": ats_score,
            "score_details": score_result,
            "full_report": score_result.get("full_report", {}),
            "resume_preview": resume_preview,
            "jd_used": bool(jd.strip()),
            "score_diff": score_diff,
            "previous_score": previous_score,
            "suggestions": suggestions,
            "gemini_available": score_result.get("gemini_available", False),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/guest-analyze-resume/")
@limiter.limit("2/minute")
async def guest_analyze_resume(
    request: Request,
    file: UploadFile,
    jd: str = Form(""),
    years: float = Form(0.0),
):
    """Guest analysis endpoint without authentication or history."""
    if not file:
        raise HTTPException(status_code=400, detail="Resume PDF is required.")
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        content = await read_upload_with_limit(file)
        resume_text = extract_text_from_pdfbytes(content) or "No text extracted."
        if len(resume_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract meaningful text from PDF")

        jd_text = jd.strip() or GENERAL_JD_TEXT
        score_result = score_resume(resume_text, jd_text)

        ats_score = score_result.get("score", 0)
        suggestions = score_result.get("gemini_suggestions", [])

        return {
            "ats_score": ats_score,
            "score_details": score_result,
            "full_report": score_result.get("full_report", {}),
            "resume_preview": build_resume_preview(resume_text),
            "jd_used": bool(jd.strip()),
            "suggestions": suggestions,
            "gemini_available": score_result.get("gemini_available", False),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/generate-cover-letter", summary="Generate AI Cover Letter", description="Generates a professional, tailored cover letter based on the user's latest resume analysis.")
@limiter.limit("5/minute")
async def api_generate_cover_letter(
    request: Request,
    jd: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get latest resume text for this user
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="No resume analysis found. Please upload and analyze your resume in the Dashboard first.")
    
    from services.llm_service import generate_cover_letter
    cover_letter = generate_cover_letter(get_analysis_resume_text(latest), jd)
    return {"cover_letter": cover_letter}

@app.post("/generate-interview-prep", summary="Generate Interview Questions", description="Generates tailored interview questions and winning tips based on the user's resume and a target job description.")
@limiter.limit("5/minute")
async def api_generate_interview_prep(
    request: Request,
    jd: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="No resume analysis found. Please upload and analyze your resume in the Dashboard first.")
    
    from services.llm_service import generate_interview_questions
    questions = generate_interview_questions(get_analysis_resume_text(latest), jd)
    return {"interview_prep": questions}

@app.post("/analyze/rewrite", summary="Rewrite Resume Bullet", description="Generates a fixed, ATS-optimized bullet point based on a detected flaw.")
@limiter.limit("10/minute")
async def api_rewrite_bullet(
    request: Request,
    flaw: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="No resume analysis found.")
    
    from services.llm_service import rewrite_bullet
    rewritten = rewrite_bullet(flaw, get_analysis_resume_text(latest))
    return {"rewritten_bullet": rewritten}

# (Adaptive learning endpoints removed — replaced by GitHub + new feature endpoints)

@app.get("/history")
async def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).limit(20).all()
    return {
        "analyses": [
            {
                "id": a.id,
                "ats_score": a.ats_score,
                "created_at": a.created_at.isoformat(),
                "resume_preview": get_analysis_resume_preview(a),
                "jd_used": (a.jd_used[:200] + "...") if a.jd_used else None,
                "score_breakdown": a.score_breakdown or {},
                "role_alignment": a.role_alignment or {},
                "gemini_suggestions": a.suggestions or [],
            }
            for a in analyses
        ]
    }


# ==================== GITHUB OAUTH ====================

@app.get("/auth/github/login")
async def github_login(
    current_user: User = Depends(get_current_user),
    redirect_to: Optional[str] = None,
    mode: str = "json",
):
    """Create a signed GitHub OAuth URL for the authenticated user."""
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(status_code=501, detail="GitHub OAuth not configured")

    state = create_signed_state(
        {
            "user_id": current_user.id,
            "redirect_to": resolve_post_oauth_redirect(redirect_to),
        },
        expires_seconds=settings.GITHUB_STATE_TTL_SECONDS,
    )
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        f"&scope=read:user"
        f"&state={state}"
    )
    if mode == "redirect":
        return RedirectResponse(url)
    return {"auth_url": url}


@app.get("/auth/github/callback")
async def github_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    """Exchange GitHub code for token, fetch profile, save to DB."""
    try:
        state_payload = decode_signed_state(state)
        user_id = int(state_payload.get("user_id"))
        redirect_to = resolve_post_oauth_redirect(state_payload.get("redirect_to"))
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid GitHub OAuth state")

    current_user = db.query(User).filter(User.id == user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            json={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="GitHub OAuth failed")
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="GitHub OAuth failed")

        gh_headers = {"Authorization": f"token {access_token}", "Accept": "application/json"}

        # Fetch user info
        user_resp = await client.get("https://api.github.com/user", headers=gh_headers)
        gh_user = user_resp.json()

        # Fetch repos
        repos_resp = await client.get(
            f"https://api.github.com/users/{gh_user['login']}/repos?per_page=100&sort=updated",
            headers=gh_headers,
        )
        repos = repos_resp.json()

        # Fetch recent events (for commits)
        events_resp = await client.get(
            f"https://api.github.com/users/{gh_user['login']}/events?per_page=30",
            headers=gh_headers,
        )
        events = events_resp.json()

    # Aggregate languages
    lang_counts: dict = {}
    total_stars = 0
    pinned = []
    for repo in (repos if isinstance(repos, list) else []):
        lang = repo.get("language")
        if lang:
            lang_counts[lang] = lang_counts.get(lang, 0) + 1
        total_stars += repo.get("stargazers_count", 0)
        if not repo.get("fork") and len(pinned) < 6:
            pinned.append({
                "name": repo.get("name"),
                "description": repo.get("description"),
                "stars": repo.get("stargazers_count", 0),
                "language": repo.get("language"),
                "url": repo.get("html_url"),
            })

    # Sort languages by count -> percentage
    total_lang = sum(lang_counts.values()) or 1
    top_languages = {k: round(v / total_lang * 100, 1) for k, v in
                     sorted(lang_counts.items(), key=lambda x: x[1], reverse=True)[:8]}

    # Recent commit messages
    recent_commits = []
    for ev in (events if isinstance(events, list) else []):
        if ev.get("type") == "PushEvent" and len(recent_commits) < 10:
            for c in ev.get("payload", {}).get("commits", []):
                recent_commits.append({
                    "repo": ev.get("repo", {}).get("name"),
                    "message": c.get("message", "")[:120],
                    "date": ev.get("created_at"),
                })

    # Save / update GitHub profile
    profile = db.query(GitHubProfile).filter(GitHubProfile.user_id == current_user.id).first()
    if not profile:
        profile = GitHubProfile(user_id=current_user.id)
        db.add(profile)

    profile.github_username = gh_user.get("login", "")
    profile.github_id = str(gh_user.get("id", ""))
    profile.avatar_url = gh_user.get("avatar_url")
    profile.bio = gh_user.get("bio")
    profile.public_repos = gh_user.get("public_repos", 0)
    profile.total_stars = total_stars
    profile.followers = gh_user.get("followers", 0)
    profile.top_languages = top_languages
    profile.pinned_repos = pinned
    profile.recent_commits = recent_commits
    profile.last_synced = datetime.utcnow()
    db.commit()

    params = urlencode({"github": "connected", "username": profile.github_username})
    return RedirectResponse(f"{redirect_to}{'&' if '?' in redirect_to else '?'}{params}")


@app.get("/github/profile")
async def get_github_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(GitHubProfile).filter(GitHubProfile.user_id == current_user.id).first()
    if not profile:
        return {"connected": False}
    return {
        "connected": True,
        "github_username": profile.github_username,
        "avatar_url": profile.avatar_url,
        "bio": profile.bio,
        "public_repos": profile.public_repos,
        "total_stars": profile.total_stars,
        "followers": profile.followers,
        "top_languages": profile.top_languages or {},
        "pinned_repos": profile.pinned_repos or [],
        "recent_commits": profile.recent_commits or [],
        "last_synced": profile.last_synced.isoformat() if profile.last_synced else None,
        "resume_gaps": profile.resume_gaps or [],
        "github_bonuses": profile.github_bonuses or [],
    }


@app.post("/github/compare")
@limiter.limit("5/minute")
async def compare_github_with_resume(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cross-reference resume skills with GitHub languages/projects."""
    profile = db.query(GitHubProfile).filter(GitHubProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Connect your GitHub first.")

    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze your resume first.")

    from services.llm_service import compare_github_resume
    result = compare_github_resume(
        resume_text=get_analysis_resume_text(latest),
        top_languages=profile.top_languages or {},
        pinned_repos=profile.pinned_repos or [],
        recent_commits=profile.recent_commits or [],
    )

    profile.resume_gaps = result.get("gaps", [])
    profile.github_bonuses = result.get("bonuses", [])
    db.commit()
    return result


# ==================== CODING ROADMAP ====================

ROLEMAP = {
    "Software Engineer": ["arrays","strings","linked-list","stack","queue","trees","graphs","dynamic-programming","backtracking","system-design"],
    "Frontend Engineer": ["arrays","strings","hash-table","sliding-window","recursion","trees","sorting","bit-manipulation","system-design"],
    "Data Scientist": ["arrays","math","statistics","sorting","matrix","dynamic-programming","graphs","probability"],
    "Backend Engineer": ["arrays","hash-table","linked-list","trees","graphs","dynamic-programming","system-design","database"],
    "DevOps Engineer": ["arrays","strings","hash-table","graphs","system-design","network"],
    "Mobile Developer": ["arrays","strings","trees","graphs","dynamic-programming","concurrency"],
    "Full Stack Engineer": ["arrays","hash-table","trees","graphs","dynamic-programming","system-design"],
    "Product Manager": ["sql","statistics","probability","arrays","math"],
}

LEETCODE_TOPICS = {
    "arrays": {"label": "Arrays & Hashing", "url": "https://leetcode.com/tag/array/", "neetcode": "https://neetcode.io/", "weeks": 1},
    "strings": {"label": "Strings", "url": "https://leetcode.com/tag/string/", "neetcode": "https://neetcode.io/", "weeks": 1},
    "sliding-window": {"label": "Sliding Window", "url": "https://leetcode.com/tag/sliding-window/", "neetcode": "https://neetcode.io/", "weeks": 1},
    "hash-table": {"label": "Hash Tables", "url": "https://leetcode.com/tag/hash-table/", "neetcode": "https://neetcode.io/", "weeks": 1},
    "linked-list": {"label": "Linked Lists", "url": "https://leetcode.com/tag/linked-list/", "neetcode": "https://neetcode.io/", "weeks": 2},
    "stack": {"label": "Stack & Queue", "url": "https://leetcode.com/tag/stack/", "neetcode": "https://neetcode.io/", "weeks": 2},
    "queue": {"label": "Queue", "url": "https://leetcode.com/tag/queue/", "neetcode": "https://neetcode.io/", "weeks": 2},
    "recursion": {"label": "Recursion", "url": "https://leetcode.com/tag/recursion/", "neetcode": "https://neetcode.io/", "weeks": 2},
    "trees": {"label": "Binary Trees", "url": "https://leetcode.com/tag/binary-tree/", "neetcode": "https://neetcode.io/", "weeks": 3},
    "graphs": {"label": "Graphs", "url": "https://leetcode.com/tag/graph/", "neetcode": "https://neetcode.io/", "weeks": 4},
    "dynamic-programming": {"label": "Dynamic Programming", "url": "https://leetcode.com/tag/dynamic-programming/", "neetcode": "https://neetcode.io/", "weeks": 5},
    "backtracking": {"label": "Backtracking", "url": "https://leetcode.com/tag/backtracking/", "neetcode": "https://neetcode.io/", "weeks": 5},
    "sorting": {"label": "Sorting Algorithms", "url": "https://leetcode.com/tag/sorting/", "neetcode": "https://neetcode.io/", "weeks": 3},
    "system-design": {"label": "System Design", "url": "https://github.com/donnemartin/system-design-primer", "neetcode": "https://neetcode.io/courses/system-design-for-beginners", "weeks": 6},
    "bit-manipulation": {"label": "Bit Manipulation", "url": "https://leetcode.com/tag/bit-manipulation/", "neetcode": "https://neetcode.io/", "weeks": 4},
    "matrix": {"label": "Matrix", "url": "https://leetcode.com/tag/matrix/", "neetcode": "https://neetcode.io/", "weeks": 3},
    "math": {"label": "Math", "url": "https://leetcode.com/tag/math/", "neetcode": "https://neetcode.io/", "weeks": 2},
    "statistics": {"label": "Statistics", "url": "https://www.khanacademy.org/math/statistics-probability", "neetcode": None, "weeks": 2},
    "probability": {"label": "Probability", "url": "https://www.khanacademy.org/math/statistics-probability", "neetcode": None, "weeks": 3},
    "sql": {"label": "SQL & Databases", "url": "https://leetcode.com/tag/database/", "neetcode": None, "weeks": 2},
    "database": {"label": "Database Design", "url": "https://leetcode.com/tag/database/", "neetcode": None, "weeks": 3},
    "concurrency": {"label": "Concurrency", "url": "https://leetcode.com/tag/concurrency/", "neetcode": None, "weeks": 5},
    "network": {"label": "Networking Basics", "url": "https://www.youtube.com/watch?v=qiQR5rTSshw", "neetcode": None, "weeks": 4},
}


@app.post("/roadmap/coding")
async def generate_coding_roadmap(
    role: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    topics = ROLEMAP.get(role, ROLEMAP["Software Engineer"])
    weeks: dict = {}
    for t in topics:
        info = LEETCODE_TOPICS.get(t, {})
        w = str(info.get("weeks", 1))
        weeks.setdefault(w, []).append({
            "id": t,
            "label": info.get("label", t.title()),
            "url": info.get("url"),
            "neetcode": info.get("neetcode"),
            "done": False,
        })

    roadmap_data = {"role": role, "weeks": weeks}
    total_topics = len(topics)

    existing = db.query(CodingRoadmap).filter(
        CodingRoadmap.user_id == current_user.id,
        CodingRoadmap.target_role == role
    ).first()
    if existing:
        existing.roadmap_data = roadmap_data
        existing.total_topics = total_topics
        existing.completed_topics = existing.completed_topics or []
    else:
        existing = CodingRoadmap(
            user_id=current_user.id,
            target_role=role,
            roadmap_data=roadmap_data,
            total_topics=total_topics,
            completed_topics=[],
            progress_pct=0.0,
        )
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return {"id": existing.id, "role": role, "roadmap": roadmap_data, "total_topics": total_topics, "progress_pct": existing.progress_pct}


@app.get("/roadmap/coding")
async def get_coding_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmaps = db.query(CodingRoadmap).filter(CodingRoadmap.user_id == current_user.id).all()
    return [{"id": r.id, "role": r.target_role, "progress_pct": r.progress_pct,
             "total_topics": r.total_topics, "completed": len(r.completed_topics or []),
             "roadmap": r.roadmap_data} for r in roadmaps]


@app.patch("/roadmap/coding/{roadmap_id}/progress")
async def update_roadmap_progress(
    roadmap_id: int,
    topic_id: str = Form(...),
    done: bool = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(CodingRoadmap).filter(
        CodingRoadmap.id == roadmap_id, CodingRoadmap.user_id == current_user.id
    ).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")

    completed = list(roadmap.completed_topics or [])
    if done and topic_id not in completed:
        completed.append(topic_id)
    elif not done and topic_id in completed:
        completed.remove(topic_id)

    roadmap.completed_topics = completed
    roadmap.progress_pct = round(len(completed) / max(roadmap.total_topics, 1) * 100, 1)
    db.commit()
    return {"progress_pct": roadmap.progress_pct, "completed": completed}


@app.post("/roadmap/ai-generate", summary="Generate Personalized AI Roadmap", description="Generates a dynamic 8-week roadmap tailored to the user's resume gaps, target role, and target company.")
@limiter.limit("5/minute")
async def generate_ai_roadmap(
    request: Request,
    target_role: str = Form(...),
    target_company: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a personalized learning roadmap using Gemini/Groq based on the
    user's latest resume analysis, their target role (e.g. SDE), and target company (e.g. Google).
    """
    # Fetch the user's most recent resume text
    latest = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).first()

    resume_text = get_analysis_resume_text(latest)

    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail="No resume found. Please upload and analyze your resume first in the Resume Lab."
        )

    from services.llm_service import generate_dynamic_roadmap

    # Check LLM cache first to avoid redundant API calls
    cache_key = _cache_key(resume_text[:500], target_role, target_company)
    cached = _get_cached(cache_key)
    if cached:
        roadmap_data = cached
    else:
        roadmap_data = generate_dynamic_roadmap(resume_text, target_role, target_company)
        _set_cached(cache_key, roadmap_data)

    # Persist the roadmap to DB
    existing = db.query(CodingRoadmap).filter(
        CodingRoadmap.user_id == current_user.id,
        CodingRoadmap.target_role == f"{target_role} @ {target_company}"
    ).first()

    if existing:
        existing.roadmap_data = roadmap_data
    else:
        existing = CodingRoadmap(
            user_id=current_user.id,
            target_role=f"{target_role} @ {target_company}",
            roadmap_data=roadmap_data,
            total_topics=len(roadmap_data.get("phases", [])),
            completed_topics=[],
            progress_pct=0.0,
        )
        db.add(existing)

    log_user_activity(
        db,
        current_user.id,
        "planning",
        note=f"Generated roadmap for {target_role} @ {target_company}",
    )
    db.commit()
    db.refresh(existing)

    return {
        "id": existing.id,
        "roadmap": roadmap_data,
        "target_role": target_role,
        "target_company": target_company,
    }


# ==================== JOB APPLICATION TRACKER ====================

@app.get("/applications")
async def list_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(JobApplication).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.is_active == True
    ).order_by(JobApplication.created_at.desc()).all()
    return [{"id": a.id, "company": a.company, "role": a.role, "stage": a.stage,
             "date_applied": a.date_applied.isoformat() if a.date_applied else None,
             "next_followup": a.next_followup.isoformat() if a.next_followup else None,
             "notes": a.notes, "job_url": a.job_url, "salary_range": a.salary_range} for a in apps]


@app.post("/applications")
async def create_application(
    company: str = Form(...),
    role: str = Form(...),
    job_url: str = Form(""),
    jd_text: str = Form(""),
    notes: str = Form(""),
    salary_range: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = JobApplication(
        user_id=current_user.id, company=company, role=role,
        job_url=job_url or None, jd_text=jd_text or None,
        notes=notes or None, salary_range=salary_range or None,
        stage="applied", date_applied=datetime.utcnow(),
    )
    db.add(app)
    log_user_activity(
        db,
        current_user.id,
        "applications",
        note=f"Added {role} at {company}",
    )
    db.commit()
    db.refresh(app)
    return {"id": app.id, "company": app.company, "role": app.role, "stage": app.stage}


@app.patch("/applications/{app_id}")
async def update_application(
    app_id: int,
    stage: str = Form(None),
    notes: str = Form(None),
    next_followup: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(JobApplication).filter(
        JobApplication.id == app_id, JobApplication.user_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if stage:
        app.stage = stage
    if notes is not None:
        app.notes = notes
    if next_followup:
        try:
            app.next_followup = datetime.fromisoformat(next_followup)
        except Exception:
            pass
    db.commit()
    return {"success": True, "stage": app.stage}


@app.delete("/applications/{app_id}")
async def delete_application(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(JobApplication).filter(
        JobApplication.id == app_id, JobApplication.user_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.is_active = False
    db.commit()
    return {"success": True}


# ==================== COMMUNICATION TOOLS ====================

@app.post("/comms/language-audit")
@limiter.limit("10/minute")
async def language_audit(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze a resume first.")
    from services.llm_service import audit_resume_language
    return audit_resume_language(get_analysis_resume_text(latest))


@app.post("/comms/elevator-pitch")
@limiter.limit("10/minute")
async def elevator_pitch(
    request: Request,
    target_role: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze a resume first.")
    from services.llm_service import generate_elevator_pitch
    return {"pitch": generate_elevator_pitch(get_analysis_resume_text(latest), target_role)}


@app.post("/comms/linkedin-headline")
@limiter.limit("10/minute")
async def linkedin_headline(
    request: Request,
    target_role: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze a resume first.")
    from services.llm_service import generate_linkedin_headlines
    return {"headlines": generate_linkedin_headlines(get_analysis_resume_text(latest), target_role)}


@app.post("/comms/cold-email")
@limiter.limit("10/minute")
async def cold_email(
    request: Request,
    company: str = Form(...),
    role: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze a resume first.")
    from services.llm_service import generate_cold_email
    return {"email": generate_cold_email(get_analysis_resume_text(latest), company, role)}


# ==================== RESUME INTELLIGENCE ====================

@app.post("/resume/rewrite-bullet")
@limiter.limit("10/minute")
async def rewrite_bullet(
    request: Request,
    bullet: str = Form(...),
    role: str = Form(""),
    current_user: User = Depends(get_current_user)
):
    from services.llm_service import rewrite_bullet_point
    return {"rewrites": rewrite_bullet_point(bullet, role)}


@app.post("/resume/keyword-heatmap")
@limiter.limit("10/minute")
async def keyword_heatmap(
    request: Request,
    jd: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze a resume first.")
    from services.llm_service import generate_keyword_heatmap
    return generate_keyword_heatmap(get_analysis_resume_text(latest), jd)


@app.post("/resume/parse-pdf")
@limiter.limit("10/minute")
async def parse_pdf_to_builder(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Parses an uploaded PDF directly into the ResumeBuilder JSON format."""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        content = await read_upload_with_limit(file)
        import PyPDF2, io
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = "".join(page.extract_text() or "" for page in pdf_reader.pages)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
        
        from services.llm_service import parse_resume_to_builder
        parsed_data = parse_resume_to_builder(text)
        return parsed_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to parse PDF for builder: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse PDF")


# ==================== DSA PROGRESS TRACKER ====================

@app.get("/dsa/progress")
async def get_dsa_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get progress plus streak and contribution data for the DSA tracker."""
    records = db.query(DSATrack).filter(DSATrack.user_id == current_user.id).all()
    progress = {r.problem_id: r.status for r in records}
    calendar = {}

    for record in records:
        if record.status != "done" or not record.completed_at:
            continue
        day_key = record.completed_at.date().isoformat()
        calendar[day_key] = calendar.get(day_key, 0) + 1

    today = datetime.utcnow().date()
    current_streak = 0
    cursor = today
    while calendar.get(cursor.isoformat(), 0) > 0:
        current_streak += 1
        cursor -= timedelta(days=1)

    return {
        "progress": progress,
        "calendar": calendar,
        "stats": {
            "completed_total": sum(1 for record in records if record.status == "done"),
            "today_completed": calendar.get(today.isoformat(), 0),
            "current_streak": current_streak,
        },
    }

@app.post("/dsa/progress")
async def update_dsa_progress(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update progress for a single problem."""
    data = await request.json()
    problem_id = data.get("problem_id")
    platform = data.get("platform", "neetcode")
    status = data.get("status", "done")
    
    if not problem_id:
        raise HTTPException(status_code=400, detail="problem_id required")
        
    track = db.query(DSATrack).filter(
        DSATrack.user_id == current_user.id,
        DSATrack.problem_id == problem_id
    ).first()
    
    if track:
        previously_done = track.status == "done"
        track.status = status
        track.platform = platform
        track.completed_at = datetime.utcnow() if status == "done" else None
    else:
        previously_done = False
        track = DSATrack(
            user_id=current_user.id,
            problem_id=problem_id,
            platform=platform,
            status=status,
            completed_at=datetime.utcnow() if status == "done" else None,
        )
        db.add(track)

    if status == "done" and not previously_done:
        log_user_activity(
            db,
            current_user.id,
            "dsa",
            note=f"Completed problem {problem_id} on {platform}",
        )

    db.commit()
    return {
        "success": True,
        "problem_id": problem_id,
        "status": status,
        "completed_at": track.completed_at.isoformat() if track.completed_at else None,
    }


# ==================== RESUME BUILDER ====================

@app.get("/resume/load")
async def load_resume_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Load the latest saved resume profile for the builder."""
    profile = db.query(ResumeProfile).filter(
        ResumeProfile.user_id == current_user.id
    ).order_by(ResumeProfile.updated_at.desc()).first()
    
    if not profile:
        return {"content": None}
        
    return {"id": profile.id, "title": profile.title, "content": profile.content}

@app.post("/resume/save")
async def save_resume_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save resume profile content from the builder."""
    data = await request.json()
    content = data.get("content")
    title = data.get("title", "My Resume")
    
    if not content:
        raise HTTPException(status_code=400, detail="content required")
        
    profile = db.query(ResumeProfile).filter(
        ResumeProfile.user_id == current_user.id
    ).order_by(ResumeProfile.updated_at.desc()).first()
    
    if profile:
        profile.content = content
        profile.title = title
    else:
        profile = ResumeProfile(
            user_id=current_user.id,
            title=title,
            content=content
        )
        db.add(profile)
        
    db.commit()
    db.refresh(profile)
    
    return {"success": True, "id": profile.id}


@app.post("/resume/analyze-builder")
@limiter.limit("10/minute")
async def analyze_builder_resume(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze the current Resume Builder content without requiring a PDF upload."""
    data = await request.json()
    content = data.get("content")
    jd = (data.get("jd") or "").strip()

    resume_text = builder_content_to_resume_text(content)
    if len(resume_text.strip()) < 80:
        raise HTTPException(status_code=400, detail="Add more resume content before analyzing from the builder.")

    jd_text = jd or GENERAL_JD_TEXT
    score_result = score_resume(resume_text, jd_text)
    ats_score = score_result.get("score", 0)
    suggestions = score_result.get("gemini_suggestions", [])

    prev_analysis = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).first()
    score_diff = (ats_score - prev_analysis.ats_score) if prev_analysis else 0
    previous_score = prev_analysis.ats_score if prev_analysis else 0

    resume_preview = build_resume_preview(resume_text)
    analysis = Analysis(
        user_id=current_user.id,
        resume_text=encrypt_resume_text(resume_text),
        resume_preview=resume_preview,
        jd_used=jd_text[:500] if jd else None,
        ats_score=int(ats_score),
        score_breakdown=score_result.get("breakdown", {}),
        keyword_gaps=score_result.get("technical_metrics", {}),
        suggestions=suggestions,
        radar_data=score_result.get("radar_data", []),
        role_alignment=score_result.get("role_alignment", {}),
    )
    db.add(analysis)
    log_user_activity(
        db,
        current_user.id,
        "resume",
        note=f"Analyzed builder resume{' for JD' if jd else ''}",
    )
    db.commit()

    return {
        "ats_score": ats_score,
        "score_details": score_result,
        "full_report": score_result.get("full_report", {}),
        "resume_preview": resume_preview,
        "jd_used": bool(jd),
        "score_diff": score_diff,
        "previous_score": previous_score,
        "suggestions": suggestions,
        "gemini_available": score_result.get("gemini_available", False),
        "source": "builder",
    }


# ==================== JOB DISCOVERY ====================

@app.get("/jobs/discover")
@limiter.limit("20/minute")
async def discover_jobs(
    request: Request,
    role: str = "software engineer",
    current_user: User = Depends(get_current_user),
):
    """Fetch real-time jobs worldwide via Adzuna API (multi-country)."""
    import asyncio

    if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
        # Fallback to Remotive if Adzuna not configured
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://remotive.com/api/remote-jobs",
                    params={"search": role, "limit": 15},
                    headers={"Accept": "application/json"},
                )
            if resp.status_code != 200:
                return {"jobs": [], "source": "remotive", "error": "API unavailable"}
            data = resp.json()
            jobs = [
                {
                    "id": j.get("id"), "title": j.get("title", ""),
                    "company": j.get("company_name", ""),
                    "tags": (j.get("tags") or [])[:5],
                    "url": j.get("url", ""),
                    "location": j.get("candidate_required_location", "Remote"),
                    "salary": j.get("salary", ""), "country": "Remote",
                    "posted": (j.get("publication_date") or "")[:10],
                    "description_snippet": (j.get("description") or "")[:400],
                }
                for j in data.get("jobs", [])[:15]
            ]
            return {"jobs": jobs, "total": len(jobs), "source": "Remotive (fallback)"}
        except Exception as e:
            return {"jobs": [], "source": "remotive", "error": str(e)}

    # Adzuna multi-country parallel fetch
    COUNTRY_NAMES = {
        "us": "USA", "gb": "UK", "in": "India", "de": "Germany",
        "fr": "France", "au": "Australia", "ca": "Canada", "nl": "Netherlands",
        "sg": "Singapore", "br": "Brazil", "it": "Italy", "es": "Spain",
        "pl": "Poland", "za": "South Africa", "nz": "New Zealand", "at": "Austria",
    }

    async def _fetch_country(client, country_code):
        try:
            resp = await client.get(
                f"https://api.adzuna.com/v1/api/jobs/{country_code}/search/1",
                params={
                    "app_id": settings.ADZUNA_APP_ID,
                    "app_key": settings.ADZUNA_APP_KEY,
                    "what": role,
                    "results_per_page": 5,
                    "content-type": "application/json",
                    "sort_by": "date",
                },
            )
            if resp.status_code != 200:
                return []
            data = resp.json()
            return [
                {
                    "id": j.get("id", f"{country_code}_{i}"),
                    "title": j.get("title", ""),
                    "company": j.get("company", {}).get("display_name", ""),
                    "tags": [t for t in (j.get("category", {}).get("tag", "") or "").split("/") if t][:3],
                    "url": j.get("redirect_url", ""),
                    "location": j.get("location", {}).get("display_name", ""),
                    "salary": f"${int(j['salary_min']):,}–${int(j['salary_max']):,}" if j.get("salary_min") and j.get("salary_max") else "",
                    "country": COUNTRY_NAMES.get(country_code, country_code.upper()),
                    "posted": (j.get("created") or "")[:10],
                    "description_snippet": (j.get("description") or "")[:400],
                }
                for i, j in enumerate(data.get("results", []))
            ]
        except Exception:
            return []

    try:
        async with httpx.AsyncClient(timeout=12) as client:
            tasks = [_fetch_country(client, cc) for cc in settings.ADZUNA_COUNTRIES[:10]]
            results = await asyncio.gather(*tasks)

        all_jobs = []
        for batch in results:
            all_jobs.extend(batch)

        # Sort by recency
        all_jobs.sort(key=lambda j: j.get("posted", ""), reverse=True)

        return {
            "jobs": all_jobs[:30],
            "total": len(all_jobs),
            "source": "Adzuna",
            "countries_queried": len(settings.ADZUNA_COUNTRIES),
        }
    except Exception as e:
        logger.error(f"Adzuna job discovery error: {e}")
        return {"jobs": [], "source": "adzuna", "error": str(e)}


@app.post("/jobs/match-resume")
@limiter.limit("10/minute")
async def match_resume_to_job(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI gap analysis: user's resume vs a specific job description."""
    data = await request.json()
    job_title = data.get("job_title", "")
    job_description = data.get("job_description", "")
    company = data.get("company", "")
    if not job_description:
        raise HTTPException(status_code=400, detail="job_description required")
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze your resume first in Resume Lab.")
    resume_text = get_analysis_resume_text(latest)
    from services.llm_service import _call_llm_json
    prompt = f"""Compare this resume against the job description. Be specific and direct.
JOB: {job_title} at {company}
JOB DESCRIPTION:\n{job_description[:2000]}
RESUME:\n{resume_text[:2000]}
Return JSON: {{"match_score": 0-100, "verdict": "Strong Match|Moderate Match|Weak Match", "missing_keywords": ["list"], "missing_skills": ["list"], "resume_tweaks": [{{"section": "Skills/Experience/Summary", "action": "exact change to make"}}], "strengths": ["list"], "one_liner": "honest 1-sentence verdict"}}"""
    result = _call_llm_json(
        prompt,
        system="You are an ATS expert recruiter. Respond only in valid JSON.",
        task="analysis_quality",
        required_keys=["match_score", "verdict", "missing_keywords", "missing_skills", "resume_tweaks", "strengths", "one_liner"],
        user_id=current_user.id,
    )
    return result or {"match_score": 0, "verdict": "Analysis failed", "missing_keywords": [], "missing_skills": [], "resume_tweaks": [], "strengths": [], "one_liner": "Could not analyze."}


@app.get("/admin/llm-metrics")
async def get_llm_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lightweight telemetry endpoint for model reliability and latency.
    Requires authentication.
    """
    if not settings.is_admin_email(current_user.email):
        raise HTTPException(status_code=403, detail="Admin access required")

    rows = db.query(LLMCallLog).order_by(LLMCallLog.created_at.desc()).limit(500).all()
    total = len(rows)
    if total == 0:
        return {
            "total_calls": 0,
            "success_rate_pct": 0.0,
            "avg_latency_ms": 0.0,
            "by_task": {},
            "by_provider": {},
        }

    success_count = sum(1 for row in rows if row.success)
    avg_latency = round(sum(row.latency_ms for row in rows) / total, 2)

    by_task: dict = {}
    by_provider: dict = {}
    for row in rows:
        task_bucket = by_task.setdefault(
            row.task,
            {"calls": 0, "success": 0, "avg_latency_ms": 0.0},
        )
        task_bucket["calls"] += 1
        task_bucket["success"] += 1 if row.success else 0
        task_bucket["avg_latency_ms"] += row.latency_ms

        provider_bucket = by_provider.setdefault(
            row.provider,
            {"calls": 0, "success": 0, "avg_latency_ms": 0.0},
        )
        provider_bucket["calls"] += 1
        provider_bucket["success"] += 1 if row.success else 0
        provider_bucket["avg_latency_ms"] += row.latency_ms

    for bucket in by_task.values():
        bucket["success_rate_pct"] = round((bucket["success"] / max(bucket["calls"], 1)) * 100, 2)
        bucket["avg_latency_ms"] = round(bucket["avg_latency_ms"] / max(bucket["calls"], 1), 2)
        del bucket["success"]

    for bucket in by_provider.values():
        bucket["success_rate_pct"] = round((bucket["success"] / max(bucket["calls"], 1)) * 100, 2)
        bucket["avg_latency_ms"] = round(bucket["avg_latency_ms"] / max(bucket["calls"], 1), 2)
        del bucket["success"]

    return {
        "total_calls": total,
        "success_rate_pct": round((success_count / total) * 100, 2),
        "avg_latency_ms": avg_latency,
        "by_task": by_task,
        "by_provider": by_provider,
    }


# ==================== HOLISTIC DAILY TRACKER ====================

@app.post("/tracker/log")
async def log_daily_activity(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from database import DailyLog
    data = await request.json()
    category = data.get("category", "")
    count = int(data.get("count", 1))
    note = data.get("note", "")
    if not category:
        raise HTTPException(status_code=400, detail="category required")
    today = datetime.utcnow().date()
    existing = db.query(DailyLog).filter(
        DailyLog.user_id == current_user.id,
        DailyLog.category == category,
        DailyLog.log_date == today
    ).first()
    if existing:
        existing.count = existing.count + count
        existing.note = note or existing.note
    else:
        db.add(DailyLog(user_id=current_user.id, category=category, count=count, note=note, log_date=today))
    db.commit()
    return {"success": True, "category": category, "date": today.isoformat()}


@app.get("/tracker/weekly")
async def get_weekly_tracker(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from database import DailyLog
    cutoff = datetime.utcnow().date() - timedelta(days=30)
    logs = db.query(DailyLog).filter(
        DailyLog.user_id == current_user.id,
        DailyLog.log_date >= cutoff
    ).all()
    calendar = {}
    by_category = {}
    for log in logs:
        day = log.log_date.isoformat()
        if day not in calendar:
            calendar[day] = {}
        calendar[day][log.category] = calendar[day].get(log.category, 0) + log.count
        by_category[log.category] = by_category.get(log.category, 0) + log.count
    today = datetime.utcnow().date()
    CATS = ["resume", "planning", "dsa", "system_design", "cs_fundamentals", "behavioral", "projects", "applications"]
    streaks = {}
    for cat in CATS:
        streak, cursor = 0, today
        while calendar.get(cursor.isoformat(), {}).get(cat, 0) > 0:
            streak += 1
            cursor -= timedelta(days=1)
        streaks[cat] = streak
    return {"calendar": calendar, "by_category": by_category, "streaks": streaks, "today": today.isoformat()}


# ==================== ALEX — AGENTIC MENTOR ====================

@app.post("/mentor/chat")
@limiter.limit("30/minute")
async def mentor_chat(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = await request.json()
    user_message = (data.get("message") or "").strip()
    is_init = data.get("is_init", False)
    if not user_message and not is_init:
        raise HTTPException(status_code=400, detail="message required")
    if is_init:
        user_message = "__init__"

    history_rows = (
        db.query(MentorConversation)
        .filter(MentorConversation.user_id == current_user.id)
        .order_by(MentorConversation.created_at.desc())
        .limit(20).all()
    )
    history = [{"role": r.role, "content": r.content} for r in reversed(history_rows)]

    from services.agent_service import run_agent
    response_text, tools_used = run_agent(
        user_message=user_message, user=current_user,
        db=db, conversation_history=history, is_init=is_init,
    )

    if not is_init:
        db.add(MentorConversation(user_id=current_user.id, role="user", content=user_message, tools_used=[]))
    db.add(MentorConversation(user_id=current_user.id, role="assistant", content=response_text, tools_used=tools_used))
    db.commit()
    return {"response": response_text, "tools_used": tools_used}


@app.get("/mentor/history")
async def mentor_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(MentorConversation)
        .filter(MentorConversation.user_id == current_user.id)
        .order_by(MentorConversation.created_at.asc())
        .limit(40).all()
    )
    return {"messages": [{"id": r.id, "role": r.role, "content": r.content,
                          "tools_used": r.tools_used or [], "created_at": r.created_at.isoformat()}
                         for r in rows]}


@app.delete("/mentor/history")
async def mentor_clear(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(MentorConversation).filter(MentorConversation.user_id == current_user.id).delete()
    db.commit()
    return {"success": True}


# ==================== MULTI-AGENT SYSTEM ====================

AGENT_INFO = {
    "nova":  {"name": "Nova",  "role": "Orchestrator",   "emoji": "🧠", "color": "#f97316", "description": "Routes requests and coordinates the team"},
    "maya":  {"name": "Maya",  "role": "Resume Analyst", "emoji": "🔍", "color": "#3b82f6", "description": "ATS scoring, keyword analysis, flaw detection"},
    "max":   {"name": "Max",   "role": "Content Writer", "emoji": "✍️",  "color": "#8b5cf6", "description": "Rewrites bullets, cover letters, outreach copy"},
    "scout": {"name": "Scout", "role": "Job Scout",      "emoji": "🎯", "color": "#22c55e", "description": "Finds matching jobs, tracks applications"},
    "alex": {"name": "Alex", "role": "Career Coach",   "emoji": "🧭", "color": "#f59e0b", "description": "Roadmaps, interview prep, career strategy"},
}


@app.get("/agents/team")
async def get_agent_team(current_user: User = Depends(get_current_user)):
    """Return info for all 5 agents."""
    try:
        from agents import get_team
        team = get_team()
        return {"agents": team.all_agents_info()}
    except Exception:
        # Fallback static info if team not initialized
        return {"agents": list(AGENT_INFO.values())}


@app.post("/agents/chat")
@limiter.limit("20/minute")
async def agents_chat_sse(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Stream a multi-agent conversation via Server-Sent Events.
    The orchestrator (Nova) classifies intent and delegates to specialists.
    """
    from starlette.responses import StreamingResponse
    from agents import get_team
    from agents.base_agent import AgentContext
    import uuid

    data = await request.json()
    user_message = (data.get("message") or "").strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="message required")

    # Build resume context from latest analysis
    resume_text = ""
    latest = db.query(Analysis).filter(
        Analysis.user_id == current_user.id
    ).order_by(Analysis.created_at.desc()).first()
    if latest:
        resume_text = get_analysis_resume_text(latest)

    job_description = (data.get("job_description") or "").strip()

    # Build user state from various sources
    user_state = {}
    try:
        from services.agent_service import build_user_context
        user_state = build_user_context(current_user, db)
    except Exception:
        pass

    # Load conversation history
    history_rows = (
        db.query(AgentConversation)
        .filter(AgentConversation.user_id == current_user.id)
        .order_by(AgentConversation.created_at.desc())
        .limit(20).all()
    )
    conversation_history = [
        {"role": "user" if r.role == "user" else "assistant", "content": r.content}
        for r in reversed(history_rows)
    ]

    session_id = uuid.uuid4().hex

    context = AgentContext(
        user_id=current_user.id,
        user_message=user_message,
        conversation_history=conversation_history,
        resume_text=resume_text,
        job_description=job_description,
        user_state=user_state,
        session_id=session_id,
        db=db,
        user=current_user,
    )

    # Save user message
    db.add(AgentConversation(
        user_id=current_user.id,
        session_id=session_id,
        agent_name="user",
        role="user",
        content=user_message,
        message_type="message",
    ))
    db.commit()

    user_id = current_user.id  # eagerly capture before session closes

    async def event_stream():
        stream_db = SessionLocal()
        team = get_team()
        nova = team.nova
        agents_used = []
        final_content = ""

        try:
            async for sse_event in nova.run(context):
                yield sse_event.format()

                if sse_event.event == "agent_message":
                    agent_name = sse_event.data.get("agent", "unknown")
                    content = sse_event.data.get("content", "")
                    final_content = content
                    if agent_name not in agents_used:
                        agents_used.append(agent_name)

                    stream_db.add(AgentConversation(
                        user_id=user_id,
                        session_id=session_id,
                        agent_name=agent_name,
                        role="agent",
                        content=content,
                        message_type="message",
                        metadata_json={
                            "color": sse_event.data.get("color"),
                            "emoji": sse_event.data.get("emoji"),
                            "tools_used": sse_event.data.get("tools_used", []),
                        },
                    ))
                    stream_db.commit()

                elif sse_event.event == "done":
                    agents_used = sse_event.data.get("agents_used", agents_used)

        except Exception as e:
            logger.error(f"Agent streaming error: {e}")
            import json as _json
            yield f"event: error\ndata: {_json.dumps({'error': str(e)})}\n\n"
            yield f"event: done\ndata: {_json.dumps({'agents_used': agents_used})}\n\n"

        try:
            stream_db.add(AgentTrace(
                user_id=user_id,
                session_id=session_id,
                trace_id=context.request_id,
                user_message=user_message,
                agents_used=agents_used,
            ))
            stream_db.commit()
        except Exception:
            pass
        finally:
            stream_db.close()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/agents/history")
async def get_agent_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Load multi-agent conversation history."""
    rows = (
        db.query(AgentConversation)
        .filter(AgentConversation.user_id == current_user.id)
        .order_by(AgentConversation.created_at.asc())
        .limit(60).all()
    )
    messages = []
    for r in rows:
        meta = r.metadata_json or {}
        if r.role == "user":
            messages.append({
                "id": r.id,
                "event_type": "user",
                "agent": "you",
                "content": r.content,
                "timestamp": r.created_at.isoformat() if r.created_at else None,
            })
        else:
            messages.append({
                "id": r.id,
                "event_type": "agent_message",
                "agent": r.agent_name,
                "emoji": meta.get("emoji", "🤖"),
                "color": meta.get("color", "#f97316"),
                "content": r.content,
                "tools_used": meta.get("tools_used", []),
                "timestamp": r.created_at.isoformat() if r.created_at else None,
            })
    return {"messages": messages}


@app.delete("/agents/history")
async def clear_agent_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear multi-agent conversation history."""
    db.query(AgentConversation).filter(
        AgentConversation.user_id == current_user.id
    ).delete()
    db.query(AgentTrace).filter(
        AgentTrace.user_id == current_user.id
    ).delete()
    db.commit()
    return {"success": True}


# ==================== FRONTEND STATIC SERVING ====================

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Mount static assets first - clearly distinguished path
    app.mount(
        "/static",
        StaticFiles(directory=str(FRONTEND_DIST), html=False),
        name="static",
    )
    
    # Also mount root files (like favicon, etc) but NOT index.html here to avoid conflict
    app.mount(
        "/assets", 
        StaticFiles(directory=str(FRONTEND_DIST), html=False), 
        name="assets"
    )

@app.get("/")
async def serve_index():
    """Serve specific index.html or fallback to API status."""
    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {
        "status": "online", 
        "service": "SmartResume API", 
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/{full_path:path}")
async def serve_spa_or_static(full_path: str):
    """
    Serve static files from root if they exist, 
    otherwise return index.html for client-side routing.
    """
    # Skip API routes
    if full_path.startswith(("api/", "docs", "redoc", "openapi.json")):
        raise HTTPException(status_code=404, detail="Not found")
    
    # Check if file exists in dist (e.g. frontend.123.js)
    file_path = FRONTEND_DIST / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # Fallback to index.html
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
    
    # Remove reload=True to avoid the warning
    uvicorn.run(app, host="0.0.0.0", port=8000)
