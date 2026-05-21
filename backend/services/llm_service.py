"""
Unified LLM Service for SmartResume
Supports Gemini (Google) and Groq (Llama 3/Mixtral)
"""

import hashlib
import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple

import google.generativeai as genai

from config import settings
from database import LLMCache, LLMCallLog, SessionLocal

# Configure Logger
logger = logging.getLogger(__name__)

# Try to import Groq (optional dependency)
GROQ_AVAILABLE = False
try:
    from groq import Groq

    GROQ_AVAILABLE = True
except ImportError:
    logger.warning("Groq package not installed. Run 'pip install groq'")

# Pre-compiled regex patterns for score extraction fallback
SCORE_PATTERNS = [
    re.compile(r'"score"\s*:\s*(\d+(?:\.\d+)?)', re.IGNORECASE),
    re.compile(r"score\s*:\s*(\d+(?:\.\d+)?)", re.IGNORECASE),
    re.compile(r"score\s+is\s+(\d+(?:\.\d+)?)", re.IGNORECASE),
    re.compile(r"(\d+(?:\.\d+)?)\s*/\s*30", re.IGNORECASE),
]

# Task-aware model lanes (cheap-fast vs higher-quality).
TASK_MODEL_LANES: dict[str, dict[str, list[str]]] = {
    "general": {"groq": [settings.GROQ_MODEL], "gemini": ["gemini-1.5-flash"]},
    "quick_copy": {"groq": ["llama-3.1-8b-instant", settings.GROQ_MODEL], "gemini": ["gemini-1.5-flash"]},
    "analysis_quality": {"groq": [settings.GROQ_MODEL], "gemini": ["gemini-1.5-pro", "gemini-1.5-flash"]},
    "structured_extract": {"groq": [settings.GROQ_MODEL], "gemini": ["gemini-1.5-pro", "gemini-1.5-flash"]},
    "mentor_planning": {"groq": [settings.GROQ_MODEL], "gemini": ["gemini-1.5-pro", "gemini-1.5-flash"]},
    # Multi-agent system: fast/cheap lane for orchestrator intent classification
    "agent_routing": {"groq": ["llama-3.1-8b-instant", settings.GROQ_MODEL], "gemini": ["gemini-1.5-flash"]},
}

# Initialize Clients
GEMINI_CONFIGURED = False
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        GEMINI_CONFIGURED = True
        logger.info("Gemini API configured successfully")
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}")

GROQ_CLIENT = None
if GROQ_AVAILABLE and settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
    try:
        GROQ_CLIENT = Groq(api_key=settings.GROQ_API_KEY)
        logger.info(f"Groq API configured successfully (Model: {settings.GROQ_MODEL})")
    except Exception as e:
        logger.error(f"Failed to configure Groq Client: {e}")


def _log_llm_call(
    task: str,
    provider: str,
    model: str,
    success: bool,
    latency_ms: int,
    error: str = "",
    user_id: Optional[int] = None,
) -> None:
    try:
        db = SessionLocal()
        try:
            db.add(
                LLMCallLog(
                    user_id=user_id,
                    task=task,
                    provider=provider,
                    model=model,
                    success=success,
                    latency_ms=latency_ms,
                    error=(error or "")[:1000] or None,
                )
            )
            db.commit()
        finally:
            db.close()
    except Exception as log_error:
        logger.warning("Failed to persist LLM telemetry: %s", log_error)


def _get_route(task: str) -> dict[str, list[str]]:
    lane = TASK_MODEL_LANES.get(task) or TASK_MODEL_LANES["general"]
    preferred = settings.LLM_PROVIDER.strip().lower()
    secondary = "gemini" if preferred == "groq" else "groq"
    ordered: dict[str, list[str]] = {}
    if lane.get(preferred):
        ordered[preferred] = lane[preferred]
    if lane.get(secondary):
        ordered[secondary] = lane[secondary]
    return ordered


def _clean_json_text(response_text: str) -> str:
    clean_text = response_text or ""
    if "```json" in clean_text:
        clean_text = clean_text.split("```json")[1].split("```")[0].strip()
    elif "```" in clean_text:
        clean_text = clean_text.split("```")[1].split("```")[0].strip()
    return clean_text


def _validate_json_payload(payload: dict, required_keys: list[str]) -> bool:
    return isinstance(payload, dict) and all(key in payload for key in required_keys)


def get_llm_evaluation(resume_text: str, jd_text: str, ml_score: float) -> Dict:
    """
    Get comprehensive evaluation from the configured LLM provider
    """
    provider = settings.LLM_PROVIDER.strip().lower()

    # Fallback logic: if preferred provider fails, try the other
    if provider == "groq" and GROQ_CLIENT:
        result = _get_groq_evaluation(resume_text, jd_text, ml_score)
        if result.get("success"):
            return result
        logger.warning("Groq failed, falling back to Gemini")
        return _get_gemini_evaluation(resume_text, jd_text, ml_score)

    # Default to Gemini
    return _get_gemini_evaluation(resume_text, jd_text, ml_score)


def _get_gemini_evaluation(resume_text: str, jd_text: str, ml_score: float) -> Dict:
    """Original Gemini evaluation logic"""
    if not GEMINI_CONFIGURED:
        return {"success": False, "error": "Gemini not configured"}

    try:
        prompt = _get_evaluation_prompt(resume_text, jd_text, ml_score)
        model_candidates = ["gemini-1.5-flash", "gemini-1.5-pro"]
        response_text = None

        for model_name in model_candidates:
            try:
                model = genai.GenerativeModel(model_name)
                generation_config = genai.types.GenerationConfig(
                    candidate_count=1, response_mime_type="application/json"
                )
                response = model.generate_content(prompt, generation_config=generation_config)
                if response.text:
                    response_text = response.text.strip()
                    break
            except Exception as e:
                logger.warning(f"Gemini {model_name} failed: {e}")
                continue

        if not response_text:
            return {"success": False, "error": "All Gemini models failed"}

        return _parse_llm_response(response_text)

    except Exception as e:
        logger.error(f"Gemini evaluation error: {e}")
        return {"success": False, "error": str(e)}


def _get_groq_evaluation(resume_text: str, jd_text: str, ml_score: float) -> Dict:
    """Groq evaluation logic using Llama 3"""
    if not GROQ_CLIENT:
        return {"success": False, "error": "Groq client not initialized"}

    try:
        prompt = _get_evaluation_prompt(resume_text, jd_text, ml_score)
        completion = GROQ_CLIENT.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert ATS (Applicant Tracking System) optimizer. Respond only in valid JSON format.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )

        response_text = completion.choices[0].message.content
        return _parse_llm_response(response_text)

    except Exception as e:
        logger.error(f"Groq evaluation error: {e}")
        return {"success": False, "error": str(e)}


def _get_evaluation_prompt(resume_text: str, jd_text: str, ml_score: float) -> str:
    return f"""
    Evaluate this resume against the job description.
    ML Model Score: {ml_score}/70 (for context)
    
    RESUME TEXT:
    {resume_text[:3000]}
    
    JOB DESCRIPTION:
    {jd_text[:2000]}
    
    RETURN A JSON OBJECT WITH:
    1. "score": (0-30 float) representing language, impact, and quality.
    2. "suggestions": (List of strings) - 3-5 specific, actionable improvements.
    3. "overall_feedback": (String) - 1-2 sentence summary.
    4. "radar_metrics": {{
         "Experience": (0-10) - relevance and depth of professional history.
         "Technical": (0-10) - proficiency in tools, languages, and technical concepts.
         "Impact": (0-10) - evidence of achievements using metrics/results.
         "Brevity": (0-10) - information density and lack of fluff.
         "Structure": (0-10) - logical organization and section clarity.
         "Language": (0-10) - professional clarity and active voice.
       }}
    
    Ensure radar_metrics are integers or floats between 0 and 10.
    """


def _parse_llm_response(response_text: str) -> Dict:
    """Common parser for LLM responses"""
    try:
        # Clean potential markdown
        clean_text = response_text
        if "```json" in response_text:
            clean_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            clean_text = response_text.split("```")[1].split("```")[0].strip()

        data = json.loads(clean_text)

        # Normalize fields - Support multiple possible keys from AI
        score = float(data.get("score", data.get("ai_score", data.get("total_score", 0))))

        # Flexibly find suggestions
        suggestions = data.get(
            "suggestions", data.get("improvements", data.get("recommendations", data.get("action_items", [])))
        )

        if not isinstance(suggestions, list):
            suggestions = [str(suggestions)] if suggestions else []

        # Ensure we have at least some suggestions if the score is low
        if not suggestions and score < 25:
            suggestions = [
                "Optimize your technical keyword density",
                "Quantify more achievements with metrics",
                "Ensure formatting is ATS-compliant",
            ]

        radar_metrics = data.get("radar_metrics", {})

        return {
            "success": True,
            "score": round(min(30.0, max(0.0, score)), 1),
            "suggestions": suggestions[:5],
            "evaluation": {
                "radar_metrics": radar_metrics,
                "overall_feedback": data.get("overall_feedback", data.get("feedback", "")),
            },
        }
    except Exception as e:
        logger.error(f"Response parsing failed: {e}. Raw response: {response_text[:200]}")
        return {"success": False, "error": "Parsing failed"}


# ── Helpers ───────────────────────────────────────────────────────────────────


def _call_llm(
    prompt: str,
    system: str = "You are an expert career coach.",
    task: str = "general",
    user_id: Optional[int] = None,
) -> str:
    """Unified LLM caller with task routing, fallback, and telemetry."""
    for provider, models in _get_route(task).items():
        for model_name in models:
            start = time.perf_counter()
            try:
                if provider == "groq" and GROQ_CLIENT:
                    resp = GROQ_CLIENT.chat.completions.create(
                        model=model_name,
                        messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                    )
                    output = resp.choices[0].message.content or ""
                    _log_llm_call(
                        task, provider, model_name, True, int((time.perf_counter() - start) * 1000), user_id=user_id
                    )
                    return output
                if provider == "gemini" and GEMINI_CONFIGURED:
                    model = genai.GenerativeModel(model_name)
                    output = (model.generate_content(prompt).text or "").strip()
                    _log_llm_call(
                        task, provider, model_name, True, int((time.perf_counter() - start) * 1000), user_id=user_id
                    )
                    return output
            except Exception as e:
                _log_llm_call(
                    task,
                    provider,
                    model_name,
                    False,
                    int((time.perf_counter() - start) * 1000),
                    error=str(e),
                    user_id=user_id,
                )
                logger.warning("LLM call failed (%s/%s): %s", provider, model_name, e)
                continue
    return ""


def _call_llm_json(
    prompt: str,
    system: str = "Respond only in valid JSON.",
    task: str = "analysis_quality",
    required_keys: Optional[list[str]] = None,
    user_id: Optional[int] = None,
) -> dict:
    """LLM JSON caller with schema checks, fallback routing, and telemetry."""
    required = required_keys or []

    # 1. Check semantic cache
    prompt_hash = hashlib.sha256(f"{task}:{system}:{prompt}".encode("utf-8")).hexdigest()
    try:
        db = SessionLocal()
        cached = db.query(LLMCache).filter(LLMCache.prompt_hash == prompt_hash).first()
        if cached:
            db.close()
            logger.info(f"LLM Cache hit for task: {task}")
            return cached.response_payload
        db.close()
    except Exception as e:
        logger.warning(f"Cache read failed: {e}")

    for provider, models in _get_route(task).items():
        for model_name in models:
            start = time.perf_counter()
            try:
                if provider == "groq" and GROQ_CLIENT:
                    resp = GROQ_CLIENT.chat.completions.create(
                        model=model_name,
                        messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                        response_format={"type": "json_object"},
                        temperature=0.1,
                    )
                    payload = json.loads(_clean_json_text(resp.choices[0].message.content or "{}"))
                elif provider == "gemini" and GEMINI_CONFIGURED:
                    model = genai.GenerativeModel(model_name)
                    cfg = genai.types.GenerationConfig(response_mime_type="application/json")
                    payload = json.loads(
                        _clean_json_text(model.generate_content(prompt, generation_config=cfg).text or "{}")
                    )
                else:
                    continue

                if required and not _validate_json_payload(payload, required):
                    raise ValueError(f"Missing required keys: {required}")

                _log_llm_call(
                    task, provider, model_name, True, int((time.perf_counter() - start) * 1000), user_id=user_id
                )

                # 2. Write to cache
                try:
                    db = SessionLocal()
                    db.add(LLMCache(prompt_hash=prompt_hash, response_payload=payload))
                    db.commit()
                    db.close()
                except Exception as e:
                    logger.warning(f"Cache write failed: {e}")

                return payload
            except Exception as e:
                _log_llm_call(
                    task,
                    provider,
                    model_name,
                    False,
                    int((time.perf_counter() - start) * 1000),
                    error=str(e),
                    user_id=user_id,
                )
                logger.warning("LLM JSON call failed (%s/%s): %s", provider, model_name, e)
                continue
    return {}


# ── Resume Text Chunking ───────────────────────────────────────────────────────


def _extract_section(resume_text: str, section_name: str) -> str:
    """Uses regex to quickly extract a specific section from the resume without LLM."""
    text_lower = resume_text.lower()

    sections = {
        "experience": [r"work\s+experience", r"professional\s+experience", r"\bexperience\b", r"employment\s+history"],
        "education": [r"\beducation\b", r"academic\s+background"],
        "skills": [r"\bskills\b", r"technical\s+skills", r"core\s+competencies"],
    }

    patterns = sections.get(section_name, [rf"\b{section_name}\b"])

    best_start = -1
    for p in patterns:
        match = re.search(p, text_lower)
        if match:
            best_start = match.start()
            break

    if best_start == -1:
        return resume_text[:1000]  # Fallback to first 1000 chars

    # Find next section header to determine end
    all_headers = [p for h_list in sections.values() for p in h_list]
    end_idx = len(resume_text)

    # Search for next header after the current one
    search_area = text_lower[best_start + 20 :]
    for h in all_headers:
        match = re.search(h, search_area)
        if match:
            end_idx = min(end_idx, best_start + 20 + match.start())

    # Return the chunk
    chunk = resume_text[best_start:end_idx].strip()
    return chunk if len(chunk) > 50 else resume_text[:1000]


# ── Original Features ─────────────────────────────────────────────────────────


def generate_cover_letter(resume_text: str, jd_text: str) -> str:
    exp = _extract_section(resume_text, "experience")
    # Extract first few lines to help LLM find the candidate's name/contact
    header_lines = "\n".join(l for l in resume_text.split("\n")[:8] if l.strip())
    return _call_llm(
        f"""Write a professional, ready-to-send cover letter. 
IMPORTANT RULES:
- Extract the candidate's real name, email, and phone from the RESUME HEADER below — never use [Your Name] or any placeholder
- Use the real company name from the JOB section — never use [Company Name] or any placeholder
- Write in first person
- Keep it under 300 words, 3 paragraphs
- End with the candidate's real name as signature

RESUME HEADER (extract name/contact from here):
{header_lines}

RELEVANT EXPERIENCE:
{exp[:1500]}

JOB / COMPANY:
{jd_text[:1000]}

Write the complete, final cover letter with NO placeholders. All fields must be filled with real data from above.""",
        system="You are an expert cover letter writer. Always use real data from the resume. Never write placeholder text like [Your Name], [Company Name], [Date], etc.",
        task="quick_copy",
    )


def generate_interview_questions(resume_text: str, jd_text: str) -> str:
    # Interviews mainly rely on experience
    exp = _extract_section(resume_text, "experience")
    return _call_llm(
        f"Generate 5 targeted interview questions with winning answer tips.\nRELEVANT EXPERIENCE:\n{exp[:2000]}\nJOB:\n{jd_text[:1000]}",
        system="You are an expert technical interviewer.",
        task="analysis_quality",
    )


def rewrite_bullet(flaw_text: str, resume_context: str) -> str:
    return _call_llm(
        f"You are an expert resume writer. The following is a flaw or suggestion found in the user's resume:\n'{flaw_text}'\n\nGiven the context of their resume:\n{resume_context[:2000]}\n\nWrite exactly ONE highly professional, metric-driven, ATS-optimized bullet point that fixes this flaw. Respond ONLY with the bullet point text, no other chat.",
        system="You are an expert resume writer focusing on XYZ format (Accomplished [X] as measured by [Y], by doing [Z]).",
        task="analysis_quality",
    )


# ── GitHub vs Resume Comparison ───────────────────────────────────────────────


def compare_github_resume(resume_text: str, top_languages: dict, pinned_repos: list, recent_commits: list) -> dict:
    """Cross-reference resume skill claims against real GitHub activity."""
    repos_summary = "\n".join(
        f"- {r.get('name')}: {r.get('description','')} ({r.get('language','')})" for r in pinned_repos[:6]
    )
    commits_summary = "\n".join(f"- [{c.get('repo')}] {c.get('message','')}" for c in recent_commits[:8])

    # We only need skills and projects to compare with GitHub
    rel_text = _extract_section(resume_text, "skills") + "\n" + _extract_section(resume_text, "projects")

    prompt = f"""Compare this resume with the candidate's real GitHub activity.

RESUME SKILLS/PROJECTS:
{rel_text[:1500]}

TOP GITHUB LANGUAGES (by repo count %):
{json.dumps(top_languages)}

PINNED REPOS:
{repos_summary}

RECENT COMMITS:
{commits_summary}

Return JSON:
{{
  "gaps": ["skill claimed on resume but NOT evidenced on GitHub"],
  "bonuses": ["skill visible on GitHub that is NOT on the resume — candidate should add these"],
  "consistency_score": 0-100,
  "summary": "one sentence overall assessment"
}}"""
    result = _call_llm_json(
        prompt,
        system="You are an expert technical recruiter. Respond in valid JSON only.",
        task="analysis_quality",
        required_keys=["gaps", "bonuses", "consistency_score", "summary"],
    )
    return result if result else {"gaps": [], "bonuses": [], "consistency_score": 50, "summary": "Analysis unavailable"}


# ── Communication Tools ───────────────────────────────────────────────────────


def audit_resume_language(resume_text: str) -> dict:
    """Score resume writing quality and flag weak language."""
    prompt = f"""Audit this resume's writing quality.
RESUME:
{resume_text[:2000]}

Return JSON:
{{
  "overall_score": 0-100,
  "passive_voice_examples": ["list up to 3 passive phrases found"],
  "vague_language_examples": ["list up to 3 vague phrases like 'helped with', 'worked on'"],
  "strong_examples": ["list up to 2 strong action verb bullets already present"],
  "fixes": [
    {{"original": "original weak phrase", "rewrite": "stronger rewrite"}}
  ],
  "action_verb_score": 0-100,
  "quantification_score": 0-100
}}"""
    result = _call_llm_json(
        prompt,
        system="You are an expert resume language coach. Respond in valid JSON only.",
        task="analysis_quality",
        required_keys=["overall_score", "fixes"],
    )
    return (
        result
        if result
        else {"overall_score": 50, "fixes": [], "passive_voice_examples": [], "vague_language_examples": []}
    )


def generate_elevator_pitch(resume_text: str, target_role: str) -> str:
    return _call_llm(
        f"Write a compelling 30-second professional elevator pitch for someone targeting '{target_role}'.\nRESUME:\n{resume_text[:1500]}\n\nMake it natural, confident, and under 80 words.",
        system="You are an expert career coach specializing in personal branding.",
        task="quick_copy",
    )


def generate_linkedin_headlines(resume_text: str, target_role: str) -> list:
    prompt = f"""Generate 3 distinct LinkedIn headline options for someone targeting '{target_role}'.
RESUME:
{resume_text[:1000]}

Return JSON: {{"headlines": ["headline 1", "headline 2", "headline 3"]}}
Each headline should be under 220 characters, keyword-rich, and compelling."""
    result = _call_llm_json(prompt, task="quick_copy", required_keys=["headlines"])
    return result.get("headlines", [f"{target_role} | Open to Opportunities"])


def generate_cold_email(resume_text: str, company: str, role: str) -> str:
    return _call_llm(
        f"Write a concise, professional cold outreach email to a recruiter at {company} for a {role} position.\nRESUME:\n{resume_text[:1000]}\n\nKeep it under 150 words. Include a subject line.",
        system="You are an expert at writing cold outreach emails that get responses.",
        task="quick_copy",
    )


# ── Resume Intelligence ───────────────────────────────────────────────────────


def rewrite_bullet_point(bullet: str, role: str = "") -> list:
    prompt = f"""Rewrite this resume bullet point in STAR format (Situation-Task-Action-Result) with strong action verbs and quantified impact. Target role: {role or 'Software Engineer'}.

ORIGINAL: {bullet}

Return JSON: {{"rewrites": ["rewrite 1", "rewrite 2", "rewrite 3"]}}
Each rewrite should start with a strong action verb and include metrics where plausible."""
    result = _call_llm_json(prompt, task="analysis_quality", required_keys=["rewrites"])
    return result.get("rewrites", [bullet])


def generate_keyword_heatmap(resume_text: str, jd_text: str) -> dict:
    prompt = f"""Analyze keyword match between this resume and job description.

RESUME:
{resume_text[:1500]}

JOB DESCRIPTION:
{jd_text[:1500]}

Return JSON:
{{
  "critical_missing": ["keywords in JD marked as required/must-have that are NOT in resume"],
  "nice_to_have_missing": ["keywords in JD that are optional/preferred but missing from resume"],
  "strong_matches": ["important keywords present strongly in both"],
  "weak_matches": ["keywords present but only mentioned once or superficially"],
  "overall_match_pct": 0-100
}}"""
    result = _call_llm_json(
        prompt,
        system="You are an ATS expert. Respond in valid JSON only.",
        task="analysis_quality",
        required_keys=["critical_missing", "overall_match_pct"],
    )
    return (
        result
        if result
        else {
            "critical_missing": [],
            "nice_to_have_missing": [],
            "strong_matches": [],
            "weak_matches": [],
            "overall_match_pct": 0,
        }
    )


# ── Dynamic AI Roadmap Generator ──────────────────────────────────────────────


def generate_dynamic_roadmap(resume_text: str, target_role: str, target_company: str) -> dict:
    """
    Generate a personalized 8-week learning roadmap based on the user's resume,
    target role (e.g. SDE), and target company (e.g. Google).
    Returns structured JSON with 4 phases (2 weeks each).
    """
    prompt = f"""You are an elite career coach and senior engineer. Analyze the candidate's resume and create a highly personalized 8-week learning roadmap to help them land a {target_role} role at {target_company}.

CANDIDATE RESUME:
{resume_text[:2500]}

TARGET ROLE: {target_role}
TARGET COMPANY: {target_company}

Instructions:
1. Identify SPECIFIC skill gaps and weaknesses in the resume compared to what {target_company} requires for a {target_role}.
2. Build a structured, actionable 4-phase plan (2 weeks each) that directly addresses those gaps.
3. For each phase, recommend specific external resources (prefer NeetCode, Striver, GFG, or LeetCode URLs).

Return ONLY a valid JSON object with this exact schema:
{{
  "role": "{target_role}",
  "company": "{target_company}",
  "summary": "One sentence explaining the biggest gap and the goal of this plan.",
  "skill_gaps": ["gap 1", "gap 2", "gap 3"],
  "phases": [
    {{
      "week_label": "Weeks 1-2",
      "title": "Phase title",
      "focus": "What specific skill/gap this phase tackles",
      "description": "Detailed 2-3 sentence action plan for these 2 weeks.",
      "resource_label": "Recommended resource name",
      "resource_url": "https://actual-link.com",
      "resource_type": "DSA|System Design|Project|Behavioral|Language"
    }},
    {{
      "week_label": "Weeks 3-4",
      "title": "Phase title",
      "focus": "...",
      "description": "...",
      "resource_label": "...",
      "resource_url": "...",
      "resource_type": "..."
    }},
    {{
      "week_label": "Weeks 5-6",
      "title": "Phase title",
      "focus": "...",
      "description": "...",
      "resource_label": "...",
      "resource_url": "...",
      "resource_type": "..."
    }},
    {{
      "week_label": "Weeks 7-8",
      "title": "Phase title",
      "focus": "...",
      "description": "...",
      "resource_label": "...",
      "resource_url": "...",
      "resource_type": "..."
    }}
  ]
}}

Be specific about the candidate's actual weaknesses. Do NOT give generic advice."""

    result = _call_llm_json(
        prompt,
        system="You are an elite career coach. Respond only in valid JSON matching the exact schema provided.",
        task="mentor_planning",
        required_keys=["role", "company", "summary", "skill_gaps", "phases"],
    )
    if not result or "phases" not in result:
        # Safe fallback
        return {
            "role": target_role,
            "company": target_company,
            "summary": f"Personalized plan to land a {target_role} role at {target_company}.",
            "skill_gaps": ["DSA fundamentals", "System Design", "Project depth"],
            "phases": [
                {
                    "week_label": "Weeks 1-2",
                    "title": "Core DSA",
                    "focus": "Arrays, Strings, Hashing",
                    "description": "Master fundamental data structures with NeetCode's Roadmap.",
                    "resource_label": "NeetCode Roadmap",
                    "resource_url": "https://neetcode.io/roadmap",
                    "resource_type": "DSA",
                },
                {
                    "week_label": "Weeks 3-4",
                    "title": "Advanced Algorithms",
                    "focus": "Trees, Graphs, DP",
                    "description": "Work through Striver's SDE Sheet topics on Trees and Graphs.",
                    "resource_label": "Striver A2Z Sheet",
                    "resource_url": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/",
                    "resource_type": "DSA",
                },
                {
                    "week_label": "Weeks 5-6",
                    "title": "Build a Strong Project",
                    "focus": "Full-stack project",
                    "description": "Build a deployable project showcasing backend, DB, and auth skills.",
                    "resource_label": "GFG Project Ideas",
                    "resource_url": "https://www.geeksforgeeks.org/top-10-projects-for-beginners-to-practice-html-and-css-skills/",
                    "resource_type": "Project",
                },
                {
                    "week_label": "Weeks 7-8",
                    "title": "System Design & Mock Interviews",
                    "focus": "System design fundamentals",
                    "description": "Study system design basics and practice mock interviews for the target role.",
                    "resource_label": "System Design Primer",
                    "resource_url": "https://github.com/donnemartin/system-design-primer",
                    "resource_type": "System Design",
                },
            ],
        }
    return result


# ── Resume Parsing to JSON ───────────────────────────────────────────────────


def parse_resume_to_builder(resume_text: str) -> dict:
    """
    Parses a raw text resume and extracts it into the structured JSON schema
    expected by the ResumeBuilder frontend component.
    """
    prompt = f"""You are an elite data extraction system. Extract the candidate's resume information into a highly structured JSON format.

RESUME TEXT:
{resume_text[:4000]}

Return ONLY a valid JSON object matching EXACTLY this schema (use empty strings or empty arrays if data is missing):
{{
  "personal": {{
    "name": "Full Name",
    "email": "Email Address",
    "phone": "Phone Number",
    "linkedin": "LinkedIn URL (just the link or handle)",
    "github": "GitHub URL (just the link or handle)"
  }},
  "summary": "Professional summary or objective statement.",
  "experience": [
    {{
      "company": "Company Name",
      "title": "Job Title",
      "startDate": "e.g. Jan 2020",
      "endDate": "e.g. Present",
      "description": "Full bulleted description of the role, each point separated by a newline."
    }}
  ],
  "education": [
    {{
      "school": "University or School Name",
      "degree": "Degree and Major",
      "year": "Graduation Year"
    }}
  ],
  "projects": [
    {{
      "name": "Project Name",
      "technologies": "Comma separated technologies used",
      "description": "Full bulleted description of the project, each point separated by a newline."
    }}
  ],
  "skills": {{
    "languages": "Comma separated list of programming languages",
    "frameworks": "Comma separated list of frameworks and libraries",
    "tools": "Comma separated list of tools, platforms, or other skills"
  }}
}}"""
    result = _call_llm_json(
        prompt,
        system="You are an expert data extractor. Respond only in valid JSON.",
        task="structured_extract",
        required_keys=["personal", "summary", "experience", "education", "projects", "skills"],
    )
    if not result:
        return {
            "personal": {"name": "", "email": "", "phone": "", "linkedin": "", "github": ""},
            "summary": "",
            "experience": [],
            "education": [],
            "projects": [],
            "skills": {"languages": "", "frameworks": "", "tools": ""},
        }
    return result
