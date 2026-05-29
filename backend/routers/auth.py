import secrets
import httpx
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode, urlparse

from fastapi import APIRouter, Depends, Form, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from config import settings
from database import (
    User,
    UserProfile,
    GitHubProfile,
    Analysis,
    get_db,
)
from auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from security_utils import (
    create_signed_state,
    decode_signed_state,
)
from email_service import send_password_reset_email
from utils.limiter import limiter
from utils.resume_utils import get_analysis_resume_text

router = APIRouter(tags=["Authentication"])

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


def build_user_payload(user: User) -> dict:
    has_profile = user.user_profile is not None
    avatar_url = user.user_profile.avatar_url if has_profile and user.user_profile.avatar_url else None
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "is_admin": settings.is_admin_email(user.email),
        "has_profile": has_profile,
        "avatar_url": avatar_url,
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


@router.post(
    "/signup",
    summary="Create User Account",
    description="Registers a new user with a unique email and username. Returns account details on success.",
)
@limiter.limit("5/minute")
async def signup(
    request: Request,
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    """Register a new user - OPTIMIZED"""
    # Validate input
    email = email.strip()
    username = username.strip()
    
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    if not username or len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")

    if not password or len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    if len(password.encode('utf-8')) > 72:
        raise HTTPException(status_code=400, detail="Password cannot be longer than 72 bytes")

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
        new_user = User(email=email.lower(), username=username.lower(), hashed_password=hashed_password)

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {"success": True, "message": "User created successfully", "user": build_user_payload(new_user)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")


@router.post(
    "/login",
    summary="User Authentication",
    description="Authenticates a user and returns a JWT access token for subsequent requests.",
)
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login endpoint - OPTIMIZED"""
    try:
        # Find user by email (case-insensitive and stripped of whitespace)
        user_email = form_data.username.strip().lower()
        user = db.query(User).filter(User.email == user_email).first()

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
        access_token = create_access_token(data={"sub": user.email, "tv": user.token_version}, expires_delta=access_token_expires)

        return {"access_token": access_token, "token_type": "bearer", "user": build_user_payload(user)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Login failed: {str(e)}")


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return build_user_payload(current_user)


@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's detailed profile"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "headline": profile.headline,
        "avatar_url": profile.avatar_url,
        "education": profile.education or {},
        "skills": profile.skills or [],
        "target_role": profile.target_role,
        "experience_level": profile.experience_level,
        "github_url": profile.github_url,
        "portfolio_url": profile.portfolio_url,
    }


@router.post("/profile")
async def save_profile(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create or update user profile"""
    data = await request.json()
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        
    if "first_name" in data: profile.first_name = data["first_name"]
    if "last_name" in data: profile.last_name = data["last_name"]
    if "headline" in data: profile.headline = data["headline"]
    if "avatar_url" in data: profile.avatar_url = data["avatar_url"]
    if "education" in data: profile.education = data["education"]
    if "skills" in data: profile.skills = data["skills"]
    if "target_role" in data: profile.target_role = data["target_role"]
    if "experience_level" in data: profile.experience_level = data["experience_level"]
    if "github_url" in data: profile.github_url = data["github_url"]
    if "portfolio_url" in data: profile.portfolio_url = data["portfolio_url"]
    
    db.commit()
    return {"success": True}


@router.get("/auth/github/login")
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


@router.get("/auth/github/callback")
async def github_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Exchange GitHub code for token, fetch profile, save to DB."""
    # User denied access on GitHub's side
    if error:
        frontend = settings.FRONTEND_APP_URL or "http://localhost:3000"
        return RedirectResponse(f"{frontend}/dashboard?github_error={error}")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing OAuth code or state")

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
            pinned.append(
                {
                    "name": repo.get("name"),
                    "description": repo.get("description"),
                    "stars": repo.get("stargazers_count", 0),
                    "language": repo.get("language"),
                    "url": repo.get("html_url"),
                }
            )

    # Sort languages by count -> percentage
    total_lang = sum(lang_counts.values()) or 1
    top_languages = {
        k: round(v / total_lang * 100, 1) for k, v in sorted(lang_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    }

    # Recent commit messages
    recent_commits = []
    for ev in (events if isinstance(events, list) else []):
        if ev.get("type") == "PushEvent" and len(recent_commits) < 10:
            for c in ev.get("payload", {}).get("commits", []):
                recent_commits.append(
                    {
                        "repo": ev.get("repo", {}).get("name"),
                        "message": c.get("message", "")[:120],
                        "date": ev.get("created_at"),
                    }
                )

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
    profile.last_synced = datetime.now(timezone.utc)
    db.commit()

    params = urlencode({"github": "connected", "username": profile.github_username})
    return RedirectResponse(f"{redirect_to}{'&' if '?' in redirect_to else '?'}{params}")


@router.get("/github/profile")
async def get_github_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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


@router.post("/github/compare")
@limiter.limit("5/minute")
async def compare_github_with_resume(
    request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
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


@router.post("/auth/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        # Prevent email enumeration by always returning 200
        return {"msg": "If your email is registered, you will receive a reset link shortly."}

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    reset_link = f"{settings.FRONTEND_APP_URL or 'http://localhost:3000'}/reset-password?token={token}"
    send_password_reset_email(user.email, reset_link)

    return {"msg": "If your email is registered, you will receive a reset link shortly."}


@router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.reset_token == req.token,
        User.reset_token_expires > datetime.now(timezone.utc)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    user.hashed_password = get_password_hash(req.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.token_version += 1
    db.commit()

    return {"msg": "Password has been reset successfully."}


@router.post("/auth/change-password")
async def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password.")

    current_user.hashed_password = get_password_hash(req.new_password)
    current_user.token_version += 1
    db.commit()

    return {"msg": "Password changed successfully."}
