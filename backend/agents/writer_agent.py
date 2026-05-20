"""
Max — Content Writer Agent
Creative, persuasive writing specialist who masters STAR format and ATS optimization.
"""

import logging
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


class WriterAgent(BaseAgent):
    """Max — the creative, persuasive Content Writer."""

    def __init__(self):
        super().__init__()
        self.name = "Max"
        self.role = "Content Writer"
        self.emoji = "✍️"
        self.color = "#8b5cf6"
        self.description = (
            "Creative and persuasive content writer who masters STAR format, "
            "knows ATS systems inside out, and crafts compelling career documents."
        )
        self.personality = (
            "Creative and persuasive with a sharp eye for impact. "
            "Transforms bland bullet points into achievement stories. "
            "Knows exactly what ATS scanners and recruiters want to see. "
            "Always provides multiple options so the user can pick their style."
        )

        self.tools = [
            AgentTool(
                name="rewrite_bullet",
                description=(
                    "Rewrite a resume bullet point in STAR format with strong "
                    "action verbs and quantified impact. Returns 3 alternative rewrites."
                ),
                parameters={
                    "bullet": "The bullet point text to rewrite",
                    "role": "The target role (e.g. 'Backend Engineer')",
                },
                handler=self._handle_rewrite_bullet,
            ),
            AgentTool(
                name="generate_cover_letter",
                description=(
                    "Generate a professional, tailored cover letter using the "
                    "user's resume and a target role/company."
                ),
                parameters={
                    "company": "The target company name",
                    "role": "The target role title",
                },
                handler=self._handle_generate_cover_letter,
            ),
            AgentTool(
                name="audit_language",
                description=(
                    "Score the resume's writing quality. Flags passive voice, "
                    "vague language, and suggests stronger rewrites."
                ),
                parameters={},
                handler=self._handle_audit_language,
            ),
            AgentTool(
                name="generate_elevator_pitch",
                description=(
                    "Generate a compelling 30-second professional elevator pitch "
                    "tailored to a target role."
                ),
                parameters={
                    "role": "The target role (e.g. 'Full Stack Developer')",
                },
                handler=self._handle_generate_elevator_pitch,
            ),
            AgentTool(
                name="generate_linkedin_headline",
                description=(
                    "Generate 3 distinct, keyword-rich LinkedIn headline options "
                    "for a target role."
                ),
                parameters={
                    "role": "The target role (e.g. 'Data Scientist')",
                },
                handler=self._handle_generate_linkedin_headline,
            ),
            AgentTool(
                name="generate_cold_email",
                description=(
                    "Write a concise, professional cold outreach email to a "
                    "recruiter at a specific company for a target role."
                ),
                parameters={
                    "company": "The target company name",
                    "role": "The target role title",
                },
                handler=self._handle_generate_cold_email,
            ),
        ]

    # ── Tool Handlers ─────────────────────────────────────────────────────

    def _handle_rewrite_bullet(self, **kwargs) -> Any:
        """Rewrite a bullet point in STAR format."""
        context: AgentContext = kwargs["context"]
        bullet = kwargs.get("bullet", "")
        role = kwargs.get("role", "Software Engineer")

        if not bullet:
            return {"error": "Please provide the bullet point text to rewrite."}

        try:
            rewrites = self._llm.rewrite_bullet_point(bullet, role)
            return {
                "original": bullet,
                "role": role,
                "rewrites": rewrites,
            }
        except Exception as exc:
            logger.error("rewrite_bullet failed: %s", exc)
            return {"error": f"Rewrite failed: {exc}"}

    def _handle_generate_cover_letter(self, **kwargs) -> Any:
        """Generate a tailored cover letter."""
        context: AgentContext = kwargs["context"]
        company = kwargs.get("company", "the company")
        role = kwargs.get("role", "Software Engineer")
        resume_text = _get_resume_text(context)

        if not resume_text:
            return {"error": "No resume text available. Upload a resume first."}

        jd = _get_jd_text(context) or f"Role: {role} at {company}"

        try:
            cover_letter = self._llm.generate_cover_letter(resume_text, jd)
            return {
                "company": company,
                "role": role,
                "cover_letter": cover_letter,
            }
        except Exception as exc:
            logger.error("generate_cover_letter failed: %s", exc)
            return {"error": f"Cover letter generation failed: {exc}"}

    def _handle_audit_language(self, **kwargs) -> Any:
        """Score writing quality and flag weak language."""
        context: AgentContext = kwargs["context"]
        resume_text = _get_resume_text(context)

        if not resume_text:
            return {"error": "No resume text available. Upload a resume first."}

        try:
            result = self._llm.audit_resume_language(resume_text)
            return result
        except Exception as exc:
            logger.error("audit_language failed: %s", exc)
            return {"error": f"Language audit failed: {exc}"}

    def _handle_generate_elevator_pitch(self, **kwargs) -> Any:
        """Generate a 30-second elevator pitch."""
        context: AgentContext = kwargs["context"]
        role = kwargs.get("role", "Software Engineer")
        resume_text = _get_resume_text(context)

        if not resume_text:
            return {"error": "No resume text available. Upload a resume first."}

        try:
            pitch = self._llm.generate_elevator_pitch(resume_text, role)
            return {
                "role": role,
                "pitch": pitch,
            }
        except Exception as exc:
            logger.error("generate_elevator_pitch failed: %s", exc)
            return {"error": f"Elevator pitch generation failed: {exc}"}

    def _handle_generate_linkedin_headline(self, **kwargs) -> Any:
        """Generate LinkedIn headline options."""
        context: AgentContext = kwargs["context"]
        role = kwargs.get("role", "Software Engineer")
        resume_text = _get_resume_text(context)

        if not resume_text:
            return {"error": "No resume text available. Upload a resume first."}

        try:
            headlines = self._llm.generate_linkedin_headlines(resume_text, role)
            return {
                "role": role,
                "headlines": headlines,
            }
        except Exception as exc:
            logger.error("generate_linkedin_headline failed: %s", exc)
            return {"error": f"LinkedIn headline generation failed: {exc}"}

    def _handle_generate_cold_email(self, **kwargs) -> Any:
        """Write a cold outreach email."""
        context: AgentContext = kwargs["context"]
        company = kwargs.get("company", "")
        role = kwargs.get("role", "Software Engineer")
        resume_text = _get_resume_text(context)

        if not resume_text:
            return {"error": "No resume text available. Upload a resume first."}

        if not company:
            return {"error": "Please provide a target company name."}

        try:
            email = self._llm.generate_cold_email(resume_text, company, role)
            return {
                "company": company,
                "role": role,
                "email": email,
            }
        except Exception as exc:
            logger.error("generate_cold_email failed: %s", exc)
            return {"error": f"Cold email generation failed: {exc}"}
