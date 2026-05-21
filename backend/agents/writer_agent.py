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
            "knows ATS systems inside out, and crafts compelling career documents. "
            "You MUST ONLY write and rewrite content (e.g. cover letters, bullets). "
            "NEVER evaluate or score resumes, search for jobs, or provide career coaching."
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
            AgentTool(
                name="draft_missing_projects",
                description=(
                    "Fetch a user's top GitHub repositories and draft resume bullet points "
                    "for projects they might have forgotten to add to their resume."
                ),
                parameters={
                    "github_username": "The user's GitHub username",
                },
                handler=self._handle_draft_missing_projects,
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
        """Generate a tailored cover letter with real user data filled in."""
        import re as _re
        context: AgentContext = kwargs["context"]
        resume_text = _get_resume_text(context)

        if not resume_text:
            return {"error": "No resume text available. Upload a resume first."}

        # ── Extract real personal details from resume ─────────────────────
        # Name: look for first non-empty line that looks like a name
        name = ""
        for line in resume_text.split("\n")[:5]:
            line = line.strip()
            if line and len(line.split()) in (2, 3) and not any(c in line for c in ["@", ":", "http", "+"]):
                name = line
                break

        # Email
        email_match = _re.search(r'[\w.+-]+@[\w-]+\.[\w.]+', resume_text)
        email = email_match.group(0) if email_match else ""

        # Phone
        phone_match = _re.search(r'[\+]?[\d\s\-\(\)]{10,15}', resume_text)
        phone = phone_match.group(0).strip() if phone_match else ""

        # LinkedIn
        linkedin_match = _re.search(r'linkedin\.com/in/[\w\-]+', resume_text, _re.IGNORECASE)
        linkedin = linkedin_match.group(0) if linkedin_match else ""

        # ── Get company/role from kwargs OR Scout's shared context ────────
        company = kwargs.get("company", "")
        role = kwargs.get("role", "")

        # Pull from previous Scout results if not explicitly provided
        if not company or not role:
            prev_results = context.shared_context.get("previous_results", [])
            for res in prev_results:
                response_text = str(res.get("response", ""))
                # Look for job title and company patterns in Scout's response
                if not company:
                    company_match = _re.search(r'at\s+([A-Z][a-zA-Z\s]+?)[\.,\n]', response_text)
                    if company_match:
                        company = company_match.group(1).strip()
                if not role:
                    role_match = _re.search(r'(Machine Learning|Software|Data|Backend|Frontend|Full.?Stack|ML|AI)\s+(?:Engineer|Scientist|Developer|Analyst)', response_text, _re.IGNORECASE)
                    if role_match:
                        role = role_match.group(0).strip()

        company = company or "the company"
        role = role or "Software Engineer"

        # ── JD context ────────────────────────────────────────────────────
        jd = _get_jd_text(context) or f"Role: {role} at {company}"

        # ── Build personalized header block ───────────────────────────────
        personal_header = f"{name}\n" if name else ""
        if email:
            personal_header += f"{email}"
        if phone:
            personal_header += f" | {phone}"
        if linkedin:
            personal_header += f" | linkedin.com/in/{linkedin.split('/')[-1]}"

        try:
            # Pass real personal data into the prompt so LLM fills everything in
            cover_letter = self._llm.generate_cover_letter(
                resume_text,
                f"Role: {role} at {company}\n{jd[:800]}",
            )

            # Post-process: replace any remaining placeholders with real data
            if name:
                cover_letter = cover_letter.replace("[Your Name]", name).replace("[Full Name]", name)
            if email:
                cover_letter = cover_letter.replace("[Your Email]", email).replace("[Email]", email)
            if phone:
                cover_letter = cover_letter.replace("[Phone]", phone).replace("[Your Phone]", phone)
            cover_letter = cover_letter.replace("[Company Name]", company).replace("[Company]", company)
            cover_letter = cover_letter.replace("[Position]", role).replace("[Role]", role)
            # Inject real header at the top if not present
            if personal_header and name and name not in cover_letter[:200]:
                cover_letter = f"{personal_header}\n\n{cover_letter}"

            return {
                "company": company,
                "role": role,
                "candidate_name": name or context.user.username if context.user else "Candidate",
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

    def _handle_draft_missing_projects(self, **kwargs) -> Any:
        """Fetch GitHub repos and draft project bullets."""
        github_username = kwargs.get("github_username", "")
        if not github_username:
            return {"error": "Please provide a GitHub username."}

        try:
            from services.github_service import fetch_user_repos
            repos = fetch_user_repos(github_username)
            if not repos:
                return {"message": f"No public repositories found for {github_username}."}
            
            # Use LLM to draft bullet points for the top 3 repos
            drafts = []
            for repo in repos[:3]:
                # Call LLM to draft bullets based on repo data
                prompt = f"""Draft a 3-bullet project section for a resume based on this GitHub repository. Use STAR format.
                Repo Name: {repo['name']}
                Description: {repo['description']}
                Primary Language: {repo['language']}
                Stars: {repo['stars']}
                """
                
                # Use existing _call_llm utility
                bullets = self._llm._call_llm(
                    prompt, 
                    system="You are an expert resume writer. Return only the bullet points, starting with a strong action verb.",
                    task="quick_copy"
                )
                
                drafts.append({
                    "project_name": repo['name'],
                    "language": repo['language'],
                    "url": repo['url'],
                    "drafted_bullets": bullets.strip()
                })
                
            return {
                "github_username": github_username,
                "suggested_projects": drafts
            }
        except Exception as exc:
            logger.error("draft_missing_projects failed: %s", exc)
            return {"error": f"Failed to draft projects: {exc}"}

