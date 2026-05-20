"""
Maya — Resume Analyst Agent
Meticulous, data-driven resume analysis with line-level feedback.
"""

import re
import logging
from typing import Any

from .base_agent import BaseAgent, AgentTool, AgentContext

logger = logging.getLogger(__name__)


# ── Shared Constants ─────────────────────────────────────────────────────────

TECH_SKILLS_PATTERN = [
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node", "express", "django", "flask", "fastapi", "spring", "spring boot",
    "sql", "mysql", "postgresql", "mongodb", "redis", "cassandra", "dynamodb",
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform",
    "ansible", "linux", "git", "rest api", "graphql", "microservices",
    "machine learning", "deep learning", "nlp", "statistics", "tableau",
    "power bi", "agile", "scrum", "project management", "system design",
    "data structures", "algorithms", "c++", "c#", "golang", "rust", "swift",
    "kotlin", "php", "ruby", "spark", "hadoop", "kafka", "api", "ui/ux",
    "devops", "cloud", "frontend", "backend", "fullstack", "mobile", "ios",
    "android", "figma", "jira", "ci/cd", "github actions", "pandas", "numpy",
    "tensorflow", "pytorch", "scikit-learn", "nextjs", "tailwind", "sass",
    "webpack", "vite", "firebase", "supabase", "elasticsearch", "rabbitmq",
    "nginx", "apache", "oauth", "jwt", "websocket", "grpc",
]

STRONG_ACTION_VERBS = {
    "led", "built", "designed", "architected", "engineered", "developed",
    "implemented", "deployed", "optimized", "reduced", "increased", "improved",
    "automated", "launched", "scaled", "managed", "mentored", "spearheaded",
    "delivered", "created", "established", "transformed", "orchestrated",
    "streamlined", "achieved", "drove", "pioneered", "integrated", "migrated",
    "refactored", "resolved", "accelerated", "negotiated", "secured",
}

WEAK_VERBS = {
    "helped", "assisted", "worked on", "was responsible for", "participated in",
    "was involved in", "contributed to", "handled", "dealt with", "did",
    "used", "utilized", "employed", "made", "got",
}

REQUIRED_SECTIONS = ["experience", "education", "skills", "summary", "projects"]
OPTIONAL_SECTIONS = ["certifications", "awards", "publications", "contact"]


# ── Helper: get resume text from context or DB ───────────────────────────────

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
    """Resolve job description from context, falling back to DB."""
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


def _extract_skills(text: str) -> set[str]:
    """Extract tech skills from text via keyword matching."""
    text_lower = text.lower()
    found = set()
    for skill in TECH_SKILLS_PATTERN:
        if re.search(rf"\b{re.escape(skill)}\b", text_lower):
            found.add(skill)
    return found


# ── Agent ─────────────────────────────────────────────────────────────────────


class AnalystAgent(BaseAgent):
    """Maya — the meticulous, data-driven Resume Analyst."""

    def __init__(self):
        super().__init__()
        self.name = "Maya"
        self.role = "Resume Analyst"
        self.emoji = "🔍"
        self.color = "#3b82f6"
        self.description = (
            "Meticulous, data-driven resume analyst who provides specific "
            "line-level feedback, keyword gap analysis, and formatting audits."
        )
        self.personality = (
            "Precise and methodical. Always backs observations with hard numbers "
            "and specific examples from the resume. Never vague — every suggestion "
            "includes the exact phrase to fix and a concrete rewrite."
        )

        self.tools = [
            AgentTool(
                name="score_resume",
                description=(
                    "Run the full scoring engine on the uploaded resume text "
                    "against the job description. Returns a 7-dimension score "
                    "with reasoning, top fixes, and strengths."
                ),
                parameters={},
                handler=self._handle_score_resume,
            ),
            AgentTool(
                name="analyze_sections",
                description=(
                    "Check the resume for missing critical sections "
                    "(experience, education, skills, summary, projects, "
                    "certifications, contact info)."
                ),
                parameters={},
                handler=self._handle_analyze_sections,
            ),
            AgentTool(
                name="check_keywords",
                description=(
                    "Compare resume keywords against the job description. "
                    "Shows matched, missing, and extra skills."
                ),
                parameters={},
                handler=self._handle_check_keywords,
            ),
            AgentTool(
                name="check_formatting",
                description=(
                    "Analyze formatting quality: bullet points, resume length, "
                    "action verb usage, and quantification density."
                ),
                parameters={},
                handler=self._handle_check_formatting,
            ),
        ]

    # ── Tool Handlers ─────────────────────────────────────────────────────

    def _handle_score_resume(self, **kwargs) -> dict:
        """Run full scoring engine via scorer_final.score_resume."""
        context: AgentContext = kwargs["context"]
        resume_text = _get_resume_text(context)
        if not resume_text:
            return {"error": "No resume text available. Please upload a resume first."}

        jd_text = _get_jd_text(context)

        try:
            from scorer_final import score_resume

            result = score_resume(resume_text, jd_text or "")
            return {
                "score": result.get("score"),
                "breakdown": result.get("breakdown"),
                "suggestions": result.get("gemini_suggestions", [])[:5],
                "radar_data": result.get("radar_data"),
                "full_report": result.get("full_report", {}),
                "ai_available": result.get("gemini_available", False),
            }
        except Exception as exc:
            logger.error("score_resume failed: %s", exc)
            return {"error": f"Scoring engine error: {exc}"}

    def _handle_analyze_sections(self, **kwargs) -> dict:
        """Check resume for required and optional sections."""
        context: AgentContext = kwargs["context"]
        resume_text = _get_resume_text(context)
        if not resume_text:
            return {"error": "No resume text available. Please upload a resume first."}

        text_lower = resume_text.lower()

        found = []
        missing = []
        for section in REQUIRED_SECTIONS:
            if re.search(rf"\b{section}\b", text_lower):
                found.append(section)
            else:
                missing.append(section)

        optional_found = []
        optional_missing = []
        for section in OPTIONAL_SECTIONS:
            # "contact" detected by email/phone presence
            if section == "contact":
                has_email = bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", resume_text))
                has_phone = bool(re.search(r"[\+]?[\d\s\-\(\)]{7,15}", resume_text))
                has_linkedin = "linkedin" in text_lower
                if has_email or has_phone or has_linkedin:
                    optional_found.append("contact info")
                    continue
                else:
                    optional_missing.append("contact info (email/phone/linkedin)")
                    continue

            if re.search(rf"\b{section}\b", text_lower):
                optional_found.append(section)
            else:
                optional_missing.append(section)

        completeness = round(len(found) / max(len(REQUIRED_SECTIONS), 1) * 100, 1)

        return {
            "required_sections_found": found,
            "required_sections_missing": missing,
            "optional_sections_found": optional_found,
            "optional_sections_missing": optional_missing,
            "completeness_pct": completeness,
            "verdict": (
                "All critical sections present."
                if not missing
                else f"Missing {len(missing)} critical section(s): {', '.join(missing)}. Add these immediately."
            ),
        }

    def _handle_check_keywords(self, **kwargs) -> dict:
        """Compare resume keywords vs job description."""
        context: AgentContext = kwargs["context"]
        resume_text = _get_resume_text(context)
        if not resume_text:
            return {"error": "No resume text available. Please upload a resume first."}

        jd_text = _get_jd_text(context)
        if not jd_text:
            # Still useful — show what skills the resume has
            resume_skills = sorted(_extract_skills(resume_text))
            return {
                "resume_skills": resume_skills,
                "total_found": len(resume_skills),
                "jd_provided": False,
                "note": "No job description provided. Showing all detected skills. Paste a JD for gap analysis.",
            }

        resume_skills = _extract_skills(resume_text)
        jd_skills = _extract_skills(jd_text)
        matched = sorted(resume_skills & jd_skills)
        missing = sorted(jd_skills - resume_skills)
        extra = sorted(resume_skills - jd_skills)
        match_pct = round(len(matched) / max(len(jd_skills), 1) * 100, 1)

        return {
            "matched_skills": matched,
            "missing_from_resume": missing,
            "extra_in_resume": extra,
            "match_pct": match_pct,
            "jd_skill_count": len(jd_skills),
            "resume_skill_count": len(resume_skills),
            "verdict": (
                f"{match_pct}% keyword overlap. "
                + (
                    f"Add these critical missing skills: {', '.join(missing[:5])}."
                    if missing
                    else "Excellent coverage!"
                )
            ),
        }

    def _handle_check_formatting(self, **kwargs) -> dict:
        """Analyze resume formatting quality with heuristic checks."""
        context: AgentContext = kwargs["context"]
        resume_text = _get_resume_text(context)
        if not resume_text:
            return {"error": "No resume text available. Please upload a resume first."}

        lines = [l.strip() for l in resume_text.split("\n") if l.strip()]
        word_count = len(resume_text.split())

        # Bullet points
        bullet_chars = ["•", "–", "►"]
        bullet_count = sum(resume_text.count(c) for c in bullet_chars) + len(
            re.findall(r"^\s*[-*]\s", resume_text, re.MULTILINE)
        )

        # Bullets as lines
        bullet_lines = [
            l for l in lines if l.startswith(("•", "-", "*", "–", "►"))
            or (20 < len(l) < 200 and not l.endswith(":"))
        ]
        total_bullets = max(len(bullet_lines), 1)

        # Quantification
        quant_count = 0
        for b in bullet_lines:
            if re.search(
                r"\d+[%$kKmM]|\d+\s*(?:percent|%|users|customers|clients|"
                r"projects|apps|days|hours|reduction|increase|improvement|"
                r"savings|revenue)",
                b,
                re.IGNORECASE,
            ):
                quant_count += 1
        quant_pct = round(quant_count / total_bullets * 100, 1)

        # Action verbs
        strong_count = 0
        weak_found = []
        strong_found = []
        for b in bullet_lines:
            clean = re.sub(r"^[•\-*–►]\s*", "", b).strip()
            for sv in STRONG_ACTION_VERBS:
                if clean.lower().startswith(sv):
                    strong_count += 1
                    if len(strong_found) < 3:
                        strong_found.append(clean[:80])
                    break
            for wv in WEAK_VERBS:
                if clean.lower().startswith(wv):
                    if len(weak_found) < 3:
                        weak_found.append(clean[:80])
                    break

        action_verb_pct = round(strong_count / total_bullets * 100, 1)

        # Length assessment
        if 350 <= word_count <= 750:
            length_verdict = f"Good length ({word_count} words, ideal 350-750)."
        elif word_count < 350:
            length_verdict = f"Too short ({word_count} words). Expand on achievements and impact."
        else:
            length_verdict = f"Too long ({word_count} words). Trim to 1-2 pages."

        return {
            "word_count": word_count,
            "bullet_count": bullet_count,
            "total_content_lines": len(lines),
            "quantification": {
                "quantified_bullets": quant_count,
                "total_bullets": total_bullets,
                "pct": quant_pct,
                "verdict": (
                    f"{quant_pct}% of bullets use metrics. "
                    + ("Good!" if quant_pct >= 50 else "Add numbers like %, $, user counts.")
                ),
            },
            "action_verbs": {
                "strong_count": strong_count,
                "pct": action_verb_pct,
                "strong_examples": strong_found,
                "weak_examples": weak_found,
                "verdict": (
                    f"{action_verb_pct}% of bullets use strong action verbs. "
                    + ("Solid." if action_verb_pct >= 60 else "Replace weak openers with verbs like 'Architected', 'Spearheaded', 'Delivered'.")
                ),
            },
            "length_verdict": length_verdict,
        }
