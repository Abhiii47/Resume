import asyncio
import logging
from datetime import datetime, timezone
import httpx
from fastapi import APIRouter, Depends, Form, HTTPException, Request
from sqlalchemy.orm import Session

from database import User, JobApplication, Analysis, get_db
from auth import get_current_user
from config import settings
from utils.limiter import limiter
from utils.activity import log_user_activity
from utils.resume_utils import get_analysis_resume_text

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Job Tracker"])


@router.get("/applications")
async def list_applications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    apps = (
        db.query(JobApplication)
        .filter(JobApplication.user_id == current_user.id, JobApplication.is_active == True)
        .order_by(JobApplication.created_at.desc())
        .all()
    )
    return [
        {
            "id": a.id,
            "company": a.company,
            "role": a.role,
            "stage": a.stage,
            "date_applied": a.date_applied.isoformat() if a.date_applied else None,
            "next_followup": a.next_followup.isoformat() if a.next_followup else None,
            "notes": a.notes,
            "job_url": a.job_url,
            "salary_range": a.salary_range,
        }
        for a in apps
    ]


@router.post("/applications")
async def create_application(
    company: str = Form(...),
    role: str = Form(...),
    job_url: str = Form(""),
    jd_text: str = Form(""),
    notes: str = Form(""),
    salary_range: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = JobApplication(
        user_id=current_user.id,
        company=company,
        role=role,
        job_url=job_url or None,
        jd_text=jd_text or None,
        notes=notes or None,
        salary_range=salary_range or None,
        stage="applied",
        date_applied=datetime.now(timezone.utc),
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


@router.patch("/applications/{app_id}")
async def update_application(
    app_id: int,
    stage: str = Form(None),
    notes: str = Form(None),
    next_followup: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = (
        db.query(JobApplication).filter(JobApplication.id == app_id, JobApplication.user_id == current_user.id).first()
    )
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


@router.delete("/applications/{app_id}")
async def delete_application(
    app_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    app = (
        db.query(JobApplication).filter(JobApplication.id == app_id, JobApplication.user_id == current_user.id).first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.is_active = False
    db.commit()
    return {"success": True}


@router.get("/jobs/discover")
@limiter.limit("20/minute")
async def discover_jobs(
    request: Request,
    role: str = "software engineer",
    current_user: User = Depends(get_current_user),
):
    """Fetch real-time jobs worldwide via Adzuna API (multi-country)."""
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
                    "id": j.get("id"),
                    "title": j.get("title", ""),
                    "company": j.get("company_name", ""),
                    "tags": (j.get("tags") or [])[:5],
                    "url": j.get("url", ""),
                    "location": j.get("candidate_required_location", "Remote"),
                    "salary": j.get("salary", ""),
                    "country": "Remote",
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
        "us": "USA",
        "gb": "UK",
        "in": "India",
        "de": "Germany",
        "fr": "France",
        "au": "Australia",
        "ca": "Canada",
        "nl": "Netherlands",
        "sg": "Singapore",
        "br": "Brazil",
        "it": "Italy",
        "es": "Spain",
        "pl": "Poland",
        "za": "South Africa",
        "nz": "New Zealand",
        "at": "Austria",
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
                    "salary": (
                        f"${int(j['salary_min']):,}–${int(j['salary_max']):,}"
                        if j.get("salary_min") and j.get("salary_max")
                        else ""
                    ),
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


@router.post("/jobs/match-resume")
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
    result = await asyncio.to_thread(
        _call_llm_json,
        prompt,
        system="You are an ATS expert recruiter. Respond only in valid JSON.",
        task="analysis_quality",
        required_keys=[
            "match_score",
            "verdict",
            "missing_keywords",
            "missing_skills",
            "resume_tweaks",
            "strengths",
            "one_liner",
        ],
        user_id=current_user.id,
    )
    return result or {
        "match_score": 0,
        "verdict": "Analysis failed",
        "missing_keywords": [],
        "missing_skills": [],
        "resume_tweaks": [],
        "strengths": [],
        "one_liner": "",
    }
