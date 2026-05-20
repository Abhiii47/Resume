"""
Scout — Job Scout Agent
Resourceful job market navigator who thinks about fit from both sides.
"""

import json
import logging
from datetime import datetime
from typing import Any

import requests

from .base_agent import BaseAgent, AgentTool, AgentContext

logger = logging.getLogger(__name__)


# ── Helper: resolve resume text ──────────────────────────────────────────────

def _get_resume_text(context: AgentContext) -> str:
    """Resolve resume text from context, falling back to latest DB analysis."""
    if context.resume_text:
        return context.resume_text

    if context.db and context.user:
        try:
            from database import Analysis
            from security_utils import decrypt_resume_text

            analysis = (
                context.db.query(Analysis)
                .filter(Analysis.user_id == context.user.id)
                .order_by(Analysis.created_at.desc())
                .first()
            )
            if analysis:
                return (
                    decrypt_resume_text(getattr(analysis, "resume_text", ""))
                    or getattr(analysis, "resume_preview", "")
                    or ""
                ).strip()
        except Exception as exc:
            logger.warning("Could not fetch resume from DB: %s", exc)

    return ""


# ── Agent ─────────────────────────────────────────────────────────────────────


class ScoutAgent(BaseAgent):
    """Scout — the resourceful Job Scout."""

    def __init__(self):
        super().__init__()
        self.name = "Scout"
        self.role = "Job Scout"
        self.emoji = "🎯"
        self.color = "#10b981"
        self.description = (
            "Resourceful job market navigator who finds opportunities, "
            "evaluates fit from both candidate and employer perspectives, "
            "and tracks the application pipeline."
        )
        self.personality = (
            "Resourceful and sharp. Thinks about job fit from both sides — "
            "what the company wants AND what the candidate needs. "
            "Knows job markets, salary ranges, and hiring trends. "
            "Never recommends a shotgun approach; every application should be strategic."
        )

        self.tools = [
            AgentTool(
                name="search_jobs",
                description=(
                    "Search for job listings via the Adzuna API. "
                    "Returns titles, companies, locations, and salary info."
                ),
                parameters={
                    "query": "Search term (e.g. 'backend engineer python')",
                    "location": "Country code (default: 'us'). Options: us, gb, in, de, fr, au, ca, nl, sg, br",
                },
                handler=self._handle_search_jobs,
            ),
            AgentTool(
                name="match_resume_to_job",
                description=(
                    "AI-powered gap analysis comparing the user's resume against "
                    "a specific job description. Returns fit score, gaps, and advice."
                ),
                parameters={
                    "job_description": "The full job description text to compare against",
                },
                handler=self._handle_match_resume_to_job,
            ),
            AgentTool(
                name="get_applications",
                description=(
                    "Get the user's tracked job applications from the database. "
                    "Shows company, role, stage, and dates."
                ),
                parameters={},
                handler=self._handle_get_applications,
            ),
            AgentTool(
                name="add_application",
                description=(
                    "Add a new job to the user's application tracker."
                ),
                parameters={
                    "company": "Company name",
                    "role": "Role title",
                    "stage": "Pipeline stage: 'wishlist', 'applied', 'screening', 'interview', 'offer', 'rejected' (default: 'applied')",
                    "url": "Optional job posting URL",
                },
                handler=self._handle_add_application,
            ),
        ]

    # ── Tool Handlers ─────────────────────────────────────────────────────

    def _handle_search_jobs(self, **kwargs) -> Any:
        """Search jobs via Adzuna API."""
        context: AgentContext = kwargs["context"]
        query = kwargs.get("query", "software engineer")
        location = kwargs.get("location", "us").strip().lower()

        try:
            from config import settings

            if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
                return {
                    "error": "Adzuna API keys not configured. Ask your admin to set ADZUNA_APP_ID and ADZUNA_APP_KEY."
                }

            url = f"https://api.adzuna.com/v1/api/jobs/{location}/search/1"
            params = {
                "app_id": settings.ADZUNA_APP_ID,
                "app_key": settings.ADZUNA_APP_KEY,
                "results_per_page": 10,
                "what": query,
                "content-type": "application/json",
            }

            resp = requests.get(url, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()

            results = data.get("results", [])
            if not results:
                return {
                    "query": query,
                    "location": location,
                    "count": 0,
                    "jobs": [],
                    "note": "No jobs found. Try broader search terms or a different location.",
                }

            jobs = []
            for job in results[:10]:
                jobs.append({
                    "title": job.get("title", ""),
                    "company": job.get("company", {}).get("display_name", "Unknown"),
                    "location": job.get("location", {}).get("display_name", ""),
                    "salary_min": job.get("salary_min"),
                    "salary_max": job.get("salary_max"),
                    "url": job.get("redirect_url", ""),
                    "description_snippet": (job.get("description", ""))[:200],
                    "created": job.get("created", ""),
                })

            return {
                "query": query,
                "location": location,
                "total_available": data.get("count", len(jobs)),
                "showing": len(jobs),
                "jobs": jobs,
            }

        except requests.RequestException as exc:
            logger.error("Adzuna API error: %s", exc)
            return {"error": f"Job search API error: {exc}"}
        except Exception as exc:
            logger.error("search_jobs failed: %s", exc)
            return {"error": f"Job search failed: {exc}"}

    def _handle_match_resume_to_job(self, **kwargs) -> Any:
        """AI gap analysis comparing resume vs a specific JD."""
        context: AgentContext = kwargs["context"]
        job_description = kwargs.get("job_description", "")
        resume_text = _get_resume_text(context)

        if not resume_text:
            return {"error": "No resume text available. Upload a resume first."}

        if not job_description:
            return {"error": "Please provide the job description text to compare against."}

        try:
            prompt = f"""Compare this resume against the job description and provide a detailed gap analysis.

RESUME:
{resume_text[:2000]}

JOB DESCRIPTION:
{job_description[:1500]}

Return JSON:
{{
    "fit_score": 0-100,
    "strong_matches": ["skills/experiences that align well"],
    "critical_gaps": ["must-have requirements the candidate lacks"],
    "nice_to_have_gaps": ["preferred qualifications that are missing"],
    "talking_points": ["strengths to emphasize in an interview"],
    "recommended_actions": ["specific steps to close the gaps before applying"],
    "verdict": "One sentence honest assessment of fit"
}}"""

            result = self._llm._call_llm_json(
                prompt,
                system="You are an expert recruiter and career advisor. Respond only in valid JSON.",
                task="analysis_quality",
                required_keys=["fit_score", "critical_gaps", "verdict"],
            )
            return result if result else {
                "error": "AI analysis unavailable. Try again shortly."
            }

        except Exception as exc:
            logger.error("match_resume_to_job failed: %s", exc)
            return {"error": f"Resume-to-job matching failed: {exc}"}

    def _handle_get_applications(self, **kwargs) -> Any:
        """Get user's tracked job applications from DB."""
        context: AgentContext = kwargs["context"]

        if not context.db or not context.user:
            return {"error": "Database session not available."}

        try:
            from database import JobApplication

            apps = (
                context.db.query(JobApplication)
                .filter(
                    JobApplication.user_id == context.user.id,
                    JobApplication.is_active == True,
                )
                .order_by(JobApplication.created_at.desc())
                .limit(20)
                .all()
            )

            if not apps:
                return {
                    "total": 0,
                    "applications": [],
                    "note": "No applications tracked yet. Use 'add_application' to start tracking.",
                }

            # Stage breakdown
            stage_counts = {}
            for a in apps:
                stage_counts[a.stage] = stage_counts.get(a.stage, 0) + 1

            # Stale detection
            now = datetime.utcnow()
            stale = []
            for a in apps:
                days = (now - a.created_at).days
                if days > 14 and a.stage not in ("offer", "rejected"):
                    stale.append(f"{a.company} ({a.role}) — {days} days, stage: {a.stage}")

            application_list = []
            for a in apps:
                application_list.append({
                    "company": a.company,
                    "role": a.role,
                    "stage": a.stage,
                    "url": a.job_url,
                    "date_applied": a.date_applied.isoformat() if a.date_applied else None,
                    "days_ago": (now - a.created_at).days,
                })

            return {
                "total": len(apps),
                "by_stage": stage_counts,
                "stale_applications": stale[:5],
                "applications": application_list,
            }

        except Exception as exc:
            logger.error("get_applications failed: %s", exc)
            return {"error": f"Failed to fetch applications: {exc}"}

    def _handle_add_application(self, **kwargs) -> Any:
        """Add a new job application to the tracker."""
        context: AgentContext = kwargs["context"]
        company = kwargs.get("company", "")
        role = kwargs.get("role", "")
        stage = kwargs.get("stage", "applied")
        url = kwargs.get("url", None)

        if not company:
            return {"error": "Company name is required."}
        if not role:
            return {"error": "Role title is required."}

        if not context.db or not context.user:
            return {"error": "Database session not available."}

        valid_stages = {"wishlist", "applied", "screening", "interview", "offer", "rejected"}
        if stage not in valid_stages:
            stage = "applied"

        try:
            from database import JobApplication

            app = JobApplication(
                user_id=context.user.id,
                company=company,
                role=role,
                stage=stage,
                job_url=url or None,
                date_applied=datetime.utcnow(),
            )
            context.db.add(app)
            context.db.commit()

            return {
                "success": True,
                "message": f"✅ Added '{role}' at '{company}' to your tracker (stage: {stage}).",
                "company": company,
                "role": role,
                "stage": stage,
            }

        except Exception as exc:
            logger.error("add_application failed: %s", exc)
            context.db.rollback()
            return {"error": f"Failed to add application: {exc}"}
