"""
Alex — Career Coach Agent
Encouraging but honest, strategic thinker focused on long-term career growth.
Replaces the old 'Alex' mentor with a warmer, more data-driven approach.
"""

import json
import logging
from datetime import datetime
from typing import Any

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


def _get_jd_text(context: AgentContext) -> str:
    """Resolve job description from context or DB."""
    if context.job_description:
        return context.job_description

    if context.db and context.user:
        try:
            from database import Analysis

            analysis = (
                context.db.query(Analysis)
                .filter(Analysis.user_id == context.user.id)
                .order_by(Analysis.created_at.desc())
                .first()
            )
            if analysis and analysis.jd_used:
                return analysis.jd_used
        except Exception as exc:
            logger.warning("Could not fetch JD from DB: %s", exc)

    return ""


# ── Agent ─────────────────────────────────────────────────────────────────────


class CoachAgent(BaseAgent):
    """Alex — the encouraging but honest Career Coach."""

    def __init__(self):
        super().__init__()
        self.name = "Alex"
        self.role = "Career Coach"
        self.emoji = "🧭"
        self.color = "#ec4899"
        self.description = (
            "Warm, direct, and data-driven career coach who focuses on "
            "long-term growth strategy, interview preparation, skill gap "
            "analysis, and personalized learning roadmaps."
        )
        self.personality = (
            "Encouraging but honest — never sugarcoats, but always frames "
            "feedback constructively. A strategic thinker who sees the big picture "
            "and connects the dots between resume data, GitHub activity, DSA progress, "
            "and job market needs. Pushes users to be proactive and consistent. "
            "Ends every response with clear, specific next steps."
        )

        self.tools = [
            AgentTool(
                name="get_career_status",
                description=(
                    "Pull the full career dashboard context: resume score, "
                    "DSA streak, job pipeline, GitHub profile, and roadmap progress."
                ),
                parameters={},
                handler=self._handle_get_career_status,
            ),
            AgentTool(
                name="generate_roadmap",
                description=(
                    "Generate a personalized 8-week learning roadmap based on "
                    "the user's resume, target role, and target company."
                ),
                parameters={
                    "role": "Target role (e.g. 'Backend Engineer')",
                    "company": "Target company (e.g. 'Google')",
                },
                handler=self._handle_generate_roadmap,
            ),
            AgentTool(
                name="interview_prep",
                description=(
                    "Generate targeted interview questions with winning answer "
                    "strategies based on the user's resume and target role."
                ),
                parameters={
                    "role": "Target role (e.g. 'Full Stack Developer')",
                },
                handler=self._handle_interview_prep,
            ),
            AgentTool(
                name="analyze_skill_gaps",
                description=(
                    "Deep skill gap analysis using the latest resume analysis "
                    "from the database. Shows score breakdown, keyword gaps, "
                    "and prioritized improvement areas."
                ),
                parameters={},
                handler=self._handle_analyze_skill_gaps,
            ),
            AgentTool(
                name="github_cross_reference",
                description=(
                    "Compare the user's resume claims against their actual "
                    "GitHub activity. Identifies gaps and hidden skills."
                ),
                parameters={},
                handler=self._handle_github_cross_reference,
            ),
        ]

    # ── Tool Handlers ─────────────────────────────────────────────────────

    def _handle_get_career_status(self, **kwargs) -> Any:
        """Pull full career dashboard context (reuses agent_service logic)."""
        context: AgentContext = kwargs["context"]

        if not context.db or not context.user:
            return {"error": "Database session not available."}

        try:
            from services.agent_service import build_user_context, _format_context

            ctx = build_user_context(context.user, context.db)
            formatted = _format_context(ctx)

            return {
                "raw": ctx,
                "formatted": formatted,
            }
        except Exception as exc:
            logger.error("get_career_status failed: %s", exc)
            return {"error": f"Failed to load career status: {exc}"}

    def _handle_generate_roadmap(self, **kwargs) -> Any:
        """Generate 8-week personalized learning roadmap."""
        context: AgentContext = kwargs["context"]
        role = kwargs.get("role", "Software Engineer")
        company = kwargs.get("company", "Top Tech Company")

        resume_text = _get_resume_text(context)
        if not resume_text:
            return {"error": "No resume text available. Upload a resume first so I can personalize the plan."}

        try:
            result = self._llm.generate_dynamic_roadmap(resume_text, role, company)
            return {
                "role": role,
                "company": company,
                "summary": result.get("summary", ""),
                "skill_gaps": result.get("skill_gaps", []),
                "phases": result.get("phases", []),
            }
        except Exception as exc:
            logger.error("generate_roadmap failed: %s", exc)
            return {"error": f"Roadmap generation failed: {exc}"}

    def _handle_interview_prep(self, **kwargs) -> Any:
        """Generate targeted interview questions with answer strategies."""
        context: AgentContext = kwargs["context"]
        role = kwargs.get("role", "Software Engineer")

        resume_text = _get_resume_text(context)
        if not resume_text:
            return {"error": "No resume text available. Upload a resume first."}

        jd_text = _get_jd_text(context) or f"Target role: {role}"

        try:
            questions = self._llm.generate_interview_questions(resume_text, jd_text)
            return {
                "role": role,
                "questions": questions,
            }
        except Exception as exc:
            logger.error("interview_prep failed: %s", exc)
            return {"error": f"Interview prep generation failed: {exc}"}

    def _handle_analyze_skill_gaps(self, **kwargs) -> Any:
        """Deep skill gap analysis using latest Analysis from DB."""
        context: AgentContext = kwargs["context"]

        if not context.db or not context.user:
            return {"error": "Database session not available."}

        try:
            from database import Analysis

            analysis = (
                context.db.query(Analysis)
                .filter(Analysis.user_id == context.user.id)
                .order_by(Analysis.created_at.desc())
                .first()
            )

            if not analysis:
                return {
                    "error": "No resume analysis found. Go to Resume Lab and analyze your resume first."
                }

            score_breakdown = analysis.score_breakdown or {}
            keyword_gaps = analysis.keyword_gaps or []
            suggestions = analysis.suggestions or []
            radar = analysis.radar_data or []

            # Identify weakest dimensions from radar data
            weakest = []
            if radar:
                sorted_dims = sorted(radar, key=lambda d: d.get("A", 50))
                weakest = [
                    {"dimension": d.get("subject", ""), "score": d.get("A", 0)}
                    for d in sorted_dims[:3]
                ]

            days_since = (datetime.utcnow() - analysis.created_at).days if analysis.created_at else None

            return {
                "ats_score": analysis.ats_score,
                "score_breakdown": score_breakdown,
                "keyword_gaps": keyword_gaps[:10] if isinstance(keyword_gaps, list) else keyword_gaps,
                "top_suggestions": suggestions[:5],
                "weakest_areas": weakest,
                "days_since_analysis": days_since,
                "jd_was_provided": bool(analysis.jd_used),
                "verdict": (
                    f"Score: {analysis.ats_score}/100. "
                    + (
                        f"Weakest area: {weakest[0]['dimension']} ({weakest[0]['score']}/100). "
                        if weakest
                        else ""
                    )
                    + (
                        f"Analysis is {days_since} days old — consider re-analyzing."
                        if days_since and days_since > 7
                        else "Analysis is recent."
                    )
                ),
            }

        except Exception as exc:
            logger.error("analyze_skill_gaps failed: %s", exc)
            return {"error": f"Skill gap analysis failed: {exc}"}

    def _handle_github_cross_reference(self, **kwargs) -> Any:
        """Compare resume vs GitHub activity."""
        context: AgentContext = kwargs["context"]

        if not context.db or not context.user:
            return {"error": "Database session not available."}

        try:
            from database import GitHubProfile

            gh = (
                context.db.query(GitHubProfile)
                .filter(GitHubProfile.user_id == context.user.id)
                .first()
            )

            if not gh:
                return {
                    "error": "No GitHub profile linked. Connect your GitHub account first (Settings → GitHub)."
                }

            resume_text = _get_resume_text(context)
            if not resume_text:
                return {
                    "error": "No resume text available. Upload a resume first, then I can cross-reference."
                }

            top_languages = gh.top_languages or {}
            pinned_repos = gh.pinned_repos or []
            recent_commits = gh.recent_commits or []

            # If we already have cached gaps/bonuses from the last sync, return those
            # alongside a fresh LLM comparison
            try:
                result = self._llm.compare_github_resume(
                    resume_text, top_languages, pinned_repos, recent_commits
                )
            except Exception as llm_exc:
                logger.warning("LLM comparison failed, using cached data: %s", llm_exc)
                result = {
                    "gaps": gh.resume_gaps or [],
                    "bonuses": gh.github_bonuses or [],
                    "consistency_score": 50,
                    "summary": "Live comparison unavailable — showing cached results from last sync.",
                }

            result["github_username"] = gh.github_username
            result["public_repos"] = gh.public_repos
            result["top_languages"] = list(top_languages.keys())[:6]

            return result

        except Exception as exc:
            logger.error("github_cross_reference failed: %s", exc)
            return {"error": f"GitHub cross-reference failed: {exc}"}
