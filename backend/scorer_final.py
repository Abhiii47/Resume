"""
SmartResume Scoring Engine v3.0
Hybrid Architecture: Heuristics (free) + Single Batched LLM Call (cost-efficient)

Produces a 7-dimension score with human-readable reasoning for each dimension.
"""
import re
import json
import logging
from typing import Dict, List, Set

logger = logging.getLogger(__name__)

GENERAL_JD_TEXT = """
Looking for a professional with strong communication, teamwork, and problem-solving skills.
Must have a proven track record of delivering results, managing projects, and collaborating with cross-functional teams.
Adaptability, leadership, and a willingness to learn are essential.
"""

# ── Skill & Keyword Dictionaries ────────────────────────────────────────────────

TECH_SKILLS = [
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

RESUME_SECTIONS = ["experience", "education", "skills", "summary", "projects",
                   "objective", "certification", "awards", "publications"]


# ── Heuristic Analysis (Free — No API Cost) ─────────────────────────────────────

def _extract_skills(text: str) -> Set[str]:
    """Extract skills from text using keyword matching."""
    text_lower = text.lower()
    found = set()
    for skill in TECH_SKILLS:
        if re.search(rf'\b{re.escape(skill)}\b', text_lower):
            found.add(skill)
    return found


def _count_quantified_bullets(text: str) -> tuple[int, int]:
    """Count bullets with numbers/metrics vs total bullets."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    bullets = [l for l in lines if l.startswith(('•', '-', '*', '–', '►'))]
    if not bullets:
        # Count sentences that look like bullet points (short lines under 200 chars)
        bullets = [l for l in lines if 20 < len(l) < 200 and not l.endswith(':')]

    quantified = 0
    for b in bullets:
        if re.search(r'\d+[%$kKmM]|\d+\s*(?:percent|%|users|customers|clients|projects|apps|days|hours|reduction|increase|improvement|savings|revenue)', b, re.IGNORECASE):
            quantified += 1

    return quantified, max(len(bullets), 1)


def _count_action_verb_bullets(text: str) -> tuple[int, int, list, list]:
    """Count bullets starting with strong/weak action verbs."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    bullets = [l for l in lines if l.startswith(('•', '-', '*', '–', '►')) or
               (20 < len(l) < 200 and not l.endswith(':'))]

    strong_count = 0
    weak_found = []
    strong_found = []

    for b in bullets:
        # Strip bullet character
        clean = re.sub(r'^[•\-*–►]\s*', '', b).strip()
        first_word = clean.split()[0].lower().rstrip('ed').rstrip('s') if clean.split() else ""

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

    return strong_count, max(len(bullets), 1), strong_found, weak_found


def heuristic_analysis(resume_text: str, jd_text: str) -> Dict:
    """
    Run free, deterministic analysis. Returns raw data that feeds into
    the LLM prompt for a more informed AI evaluation.
    """
    res_lower = resume_text.lower()

    # 1. Skills & Keywords
    resume_skills = _extract_skills(resume_text)
    jd_skills = _extract_skills(jd_text)
    matched_skills = resume_skills & jd_skills
    missing_skills = jd_skills - resume_skills
    extra_skills = resume_skills - jd_skills

    if jd_skills:
        keyword_pct = round(len(matched_skills) / max(len(jd_skills), 1) * 100, 1)
    else:
        keyword_pct = min(100.0, len(resume_skills) * 8)  # No JD: score on skill count

    # 2. Sections
    sections_found = []
    for section in RESUME_SECTIONS:
        if re.search(rf'\b{section}\b', res_lower):
            sections_found.append(section)

    # 3. Length
    word_count = len(resume_text.split())

    # 4. Formatting
    bullet_count = sum(resume_text.count(c) for c in ['•', '–', '►']) + \
                   len(re.findall(r'^\s*[-*]\s', resume_text, re.MULTILINE))

    # 5. Quantification
    quant_count, total_bullets = _count_quantified_bullets(resume_text)
    quant_pct = round(quant_count / total_bullets * 100, 1)

    # 6. Action Verbs
    strong_count, total_verb_bullets, strong_examples, weak_examples = _count_action_verb_bullets(resume_text)
    action_verb_pct = round(strong_count / total_verb_bullets * 100, 1)

    # 7. Contact info
    has_email = bool(re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', resume_text))
    has_phone = bool(re.search(r'[\+]?[\d\s\-\(\)]{7,15}', resume_text))
    has_linkedin = bool(re.search(r'linkedin', res_lower))

    return {
        "resume_skills": sorted(resume_skills),
        "jd_skills": sorted(jd_skills),
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
        "extra_skills": sorted(extra_skills),
        "keyword_match_pct": keyword_pct,
        "sections_found": sections_found,
        "sections_missing": [s for s in ["experience", "education", "skills", "summary", "projects"]
                            if s not in sections_found],
        "word_count": word_count,
        "bullet_count": bullet_count,
        "quantified_bullets": quant_count,
        "total_bullets": total_bullets,
        "quantification_pct": quant_pct,
        "strong_verb_count": strong_count,
        "action_verb_pct": action_verb_pct,
        "strong_verb_examples": strong_examples,
        "weak_verb_examples": weak_examples,
        "has_email": has_email,
        "has_phone": has_phone,
        "has_linkedin": has_linkedin,
    }


# ── LLM-Powered Deep Analysis (Single Batched Call) ─────────────────────────────

def _build_llm_prompt(resume_text: str, jd_text: str, heuristics: Dict) -> str:
    """
    Build a single comprehensive prompt that returns the ENTIRE analysis
    in one LLM call. This replaces 4-5 separate calls.
    """
    return f"""You are an expert ATS (Applicant Tracking System) analyst and senior recruiter at a Fortune 500 company.

TASK: Perform a comprehensive resume analysis. Return a SINGLE JSON response covering scoring, reasoning, fixes, and interview prep.

RESUME TEXT:
{resume_text[:3000]}

JOB DESCRIPTION:
{jd_text[:1500]}

PRE-COMPUTED HEURISTICS (use these as ground truth, don't re-count):
- Skills in resume: {', '.join(heuristics['resume_skills'][:20])} ({len(heuristics['resume_skills'])} total)
- Skills in JD: {', '.join(heuristics['jd_skills'][:15])} ({len(heuristics['jd_skills'])} total)
- Matched skills: {', '.join(heuristics['matched_skills'][:15])}
- Missing from resume: {', '.join(heuristics['missing_skills'][:10])}
- Sections found: {', '.join(heuristics['sections_found'])}
- Sections missing: {', '.join(heuristics['sections_missing'])}
- Word count: {heuristics['word_count']}
- Bullet points: {heuristics['bullet_count']}
- Quantified bullets: {heuristics['quantified_bullets']}/{heuristics['total_bullets']}
- Strong action verbs: {heuristics['strong_verb_count']}/{heuristics['total_bullets']}
- Weak verb examples: {heuristics['weak_verb_examples']}

Return EXACTLY this JSON structure:
{{
    "scores": {{
        "keywords": 0-100,
        "formatting": 0-100,
        "impact": 0-100,
        "length": 0-100,
        "relevance": 0-100,
        "action_verbs": 0-100,
        "quantification": 0-100
    }},
    "reasoning": {{
        "keywords": "2-3 sentence explanation of keyword match quality",
        "formatting": "2-3 sentence explanation of structure and readability",
        "impact": "2-3 sentence explanation of achievement impact and depth",
        "length": "1-2 sentence on resume length appropriateness",
        "relevance": "2-3 sentence on how well experience matches the target role",
        "action_verbs": "2-3 sentence on verb strength and writing quality",
        "quantification": "2-3 sentence on use of metrics and numbers"
    }},
    "top_fixes": [
        {{"priority": 1, "category": "one of the 7 categories", "original": "exact weak phrase from resume (if applicable)", "fix": "specific actionable rewrite or instruction"}},
        {{"priority": 2, "category": "...", "original": "...", "fix": "..."}},
        {{"priority": 3, "category": "...", "original": "...", "fix": "..."}},
        {{"priority": 4, "category": "...", "original": "...", "fix": "..."}},
        {{"priority": 5, "category": "...", "original": "...", "fix": "..."}}
    ],
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "overall_verdict": "One honest, direct sentence summarizing the resume quality.",
    "interview_questions": [
        {{"question": "Targeted interview question based on resume content", "tip": "Brief strategy for answering well"}},
        {{"question": "...", "tip": "..."}},
        {{"question": "...", "tip": "..."}}
    ]
}}

Rules:
- Be BRUTALLY honest. A mediocre resume should score 40-60, not 70+.
- Reference SPECIFIC lines/phrases from the resume in your reasoning.
- top_fixes must contain exact rewrites, not generic advice.
- Scores must be consistent with reasoning (don't say "great keywords" then score 45).
- All 7 scores must be present. Use the heuristic data as anchor points."""


def _llm_full_analysis(resume_text: str, jd_text: str, heuristics: Dict) -> Dict:
    """Single LLM call for the entire analysis."""
    from services.llm_service import _call_llm_json

    prompt = _build_llm_prompt(resume_text, jd_text, heuristics)

    result = _call_llm_json(
        prompt,
        system="You are an expert ATS recruiter. Respond ONLY in valid JSON matching the exact schema.",
        task="analysis_quality",
        required_keys=["scores", "reasoning", "top_fixes", "strengths", "overall_verdict"],
    )

    return result if result else {}


def _compute_heuristic_scores(h: Dict) -> Dict:
    """Compute numeric scores from heuristics as fallback."""
    # Keywords
    kw_score = min(100, h["keyword_match_pct"] * 1.1)

    # Formatting
    section_score = (len(h["sections_found"]) / 5.0) * 100
    bullet_score = min(100, (h["bullet_count"] / 12.0) * 100)
    contact_score = (sum([h["has_email"], h["has_phone"], h["has_linkedin"]]) / 3.0) * 100
    fmt_score = section_score * 0.5 + bullet_score * 0.3 + contact_score * 0.2

    # Length
    wc = h["word_count"]
    if 350 <= wc <= 750:
        len_score = 100
    elif wc < 350:
        len_score = max(0, (wc / 350) * 100)
    else:
        len_score = max(0, 100 - ((wc - 750) / 8))

    # Quantification
    q_score = min(100, h["quantification_pct"] * 1.5)

    # Action verbs
    av_score = min(100, h["action_verb_pct"] * 1.3)

    return {
        "keywords": round(kw_score, 1),
        "formatting": round(fmt_score, 1),
        "impact": 50.0,  # Can't assess without LLM
        "length": round(len_score, 1),
        "relevance": round(kw_score * 0.8, 1),  # Proxy
        "action_verbs": round(av_score, 1),
        "quantification": round(q_score, 1),
    }


def _generate_heuristic_reasoning(h: Dict, scores: Dict) -> Dict:
    """Generate reasoning text from heuristics alone (fallback)."""
    return {
        "keywords": f"Your resume matches {len(h['matched_skills'])} of {len(h['jd_skills'])} skills from the job description ({h['keyword_match_pct']}% overlap). "
                    f"Missing: {', '.join(h['missing_skills'][:5]) or 'none detected'}.",
        "formatting": f"Found {len(h['sections_found'])}/5 key sections ({', '.join(h['sections_found'])}). "
                      f"{'Missing: ' + ', '.join(h['sections_missing']) + '.' if h['sections_missing'] else 'All critical sections present.'}",
        "impact": "Impact analysis requires AI evaluation. Upload again when the AI service is available for a deeper assessment.",
        "length": f"Resume is {h['word_count']} words. " +
                  ("Ideal range (350–750 words)." if 350 <= h['word_count'] <= 750
                   else f"{'Too short — expand on achievements.' if h['word_count'] < 350 else 'Consider trimming to 1-2 pages.'}"),
        "relevance": f"Skill overlap with the job description is {h['keyword_match_pct']}%. " +
                     (f"Add these missing skills: {', '.join(h['missing_skills'][:5])}." if h['missing_skills'] else "Good coverage."),
        "action_verbs": f"{h['strong_verb_count']} of {h['total_bullets']} bullets start with strong action verbs. " +
                        (f"Weak verbs found: {'; '.join(h['weak_verb_examples'][:2])}." if h['weak_verb_examples'] else "Good verb usage."),
        "quantification": f"{h['quantified_bullets']} of {h['total_bullets']} bullets include quantified metrics ({h['quantification_pct']}%). " +
                          ("Add numbers like percentages, dollar amounts, or user counts to strengthen impact." if h['quantification_pct'] < 50 else "Good use of metrics."),
    }


# ── Main Entry Point ────────────────────────────────────────────────────────────

def score_resume(resume_text: str, jd: str, skills_resume="", skills_jd="",
                 years_resume=0, years_jd=0, **kwargs) -> Dict:
    """
    Main scoring entrypoint.
    Uses heuristics as foundation + single LLM call for deep analysis.
    **kwargs catches any extra arguments like use_gemini for backward compatibility.
    """
    try:
        jd_text = jd.strip() or GENERAL_JD_TEXT

        # Phase 1: Free heuristic analysis
        heuristics = heuristic_analysis(resume_text, jd_text)

        # Phase 2: LLM deep analysis (single call)
        llm_result = _llm_full_analysis(resume_text, jd_text, heuristics)

        # Determine scores — prefer LLM, fallback to heuristics
        if llm_result and "scores" in llm_result:
            scores = llm_result["scores"]
            reasoning = llm_result.get("reasoning", {})
            top_fixes = llm_result.get("top_fixes", [])
            strengths = llm_result.get("strengths", [])
            verdict = llm_result.get("overall_verdict", "")
            interview_questions = llm_result.get("interview_questions", [])
            ai_available = True
        else:
            scores = _compute_heuristic_scores(heuristics)
            reasoning = _generate_heuristic_reasoning(heuristics, scores)
            top_fixes = []
            strengths = []
            verdict = "AI analysis unavailable — showing heuristic scores only."
            interview_questions = []
            ai_available = False

            # Generate basic fixes from heuristics
            if heuristics["missing_skills"]:
                top_fixes.append({
                    "priority": 1, "category": "keywords",
                    "original": "", "fix": f"Add these missing skills to your Skills section: {', '.join(heuristics['missing_skills'][:5])}"
                })
            if heuristics["quantification_pct"] < 40:
                top_fixes.append({
                    "priority": 2, "category": "quantification",
                    "original": "", "fix": "Add metrics to your bullet points (e.g., 'Improved performance by 30%', 'Managed 5-person team')"
                })
            if heuristics["weak_verb_examples"]:
                top_fixes.append({
                    "priority": 3, "category": "action_verbs",
                    "original": heuristics["weak_verb_examples"][0],
                    "fix": f"Replace weak opening '{heuristics['weak_verb_examples'][0][:40]}...' with a strong verb like 'Architected', 'Spearheaded', or 'Delivered'"
                })
            if heuristics["sections_missing"]:
                top_fixes.append({
                    "priority": 4, "category": "formatting",
                    "original": "", "fix": f"Add missing sections: {', '.join(heuristics['sections_missing'])}"
                })

        # Compute weighted final score
        weights = {
            "keywords": 0.20, "formatting": 0.10, "impact": 0.20,
            "length": 0.05, "relevance": 0.20, "action_verbs": 0.10,
            "quantification": 0.15
        }
        final_score = int(sum(
            scores.get(dim, 50) * w for dim, w in weights.items()
        ))
        final_score = max(0, min(100, final_score))

        # Build backward-compatible breakdown
        breakdown = {
            "total_score": final_score,
            "keyword_match": round(scores.get("keywords", 50) * 0.35, 1),
            "format_readability": round(scores.get("formatting", 50) * 0.30, 1),
            "impact_metrics": round(scores.get("impact", 50) * 0.35, 1),
        }

        # Radar data for visualization
        radar_data = [
            {"subject": dim.replace("_", " ").title(), "A": scores.get(dim, 50), "fullMark": 100}
            for dim in ["keywords", "formatting", "impact", "relevance", "action_verbs", "quantification", "length"]
        ]

        # Role alignment
        role_alignment = {
            "Target Role": final_score,
            "Adjacent Role": max(0, final_score - 12),
            "Junior Role": min(100, final_score + 15),
        }

        # Suggestions (backward compatible — flat list of strings)
        suggestions = [fix["fix"] for fix in top_fixes[:5]]

        # Build the full report
        full_report = {
            "scores": scores,
            "reasoning": reasoning,
            "top_fixes": top_fixes,
            "strengths": strengths,
            "overall_verdict": verdict,
            "interview_questions": interview_questions,
            "heuristics": {
                "matched_skills": heuristics["matched_skills"],
                "missing_skills": heuristics["missing_skills"],
                "extra_skills": heuristics["extra_skills"][:10],
                "sections_found": heuristics["sections_found"],
                "sections_missing": heuristics["sections_missing"],
                "word_count": heuristics["word_count"],
                "bullet_count": heuristics["bullet_count"],
                "quantified_ratio": f"{heuristics['quantified_bullets']}/{heuristics['total_bullets']}",
                "action_verb_ratio": f"{heuristics['strong_verb_count']}/{heuristics['total_bullets']}",
            }
        }

        return {
            "score": final_score,
            "breakdown": breakdown,
            "technical_metrics": {
                "keyword_match_level": _get_level(scores.get("keywords", 50)),
                "section_completeness": f"{len(heuristics['sections_found'])}/5",
                "formatting_level": _get_level(scores.get("formatting", 50)),
                "resume_len": heuristics["word_count"],
                "resume_skills": heuristics["resume_skills"][:20],
            },
            "gemini_suggestions": suggestions,
            "gemini_available": ai_available,
            "radar_data": radar_data,
            "role_alignment": role_alignment,
            "full_report": full_report,
            "error": None,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "score": 50,
            "breakdown": {"error": "Scoring failed, returned default"},
            "technical_metrics": {},
            "gemini_suggestions": ["An error occurred during analysis. The score shown is approximate."],
            "gemini_available": False,
            "radar_data": [],
            "role_alignment": {},
            "full_report": {},
            "error": str(e),
        }


def _get_level(score: float) -> str:
    if score >= 80:
        return "Excellent"
    if score >= 60:
        return "Good"
    if score >= 40:
        return "Standard"
    return "Needs Improvement"
