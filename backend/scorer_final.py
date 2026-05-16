import re
import json
from services.llm_service import _call_llm_json

GENERAL_JD_TEXT = """
Looking for a professional with strong communication, teamwork, and problem-solving skills.
Must have a proven track record of delivering results, managing projects, and collaborating with cross-functional teams.
Adaptability, leadership, and a willingness to learn are essential.
"""

def _skills_set(skills: str):
    return set(s.strip().lower() for s in str(skills).split(",") if s.strip())

def _extract_skills_heuristically(text: str):
    """Detect skills from text using a predefined list"""
    skills = [
        "python", "java", "javascript", "typescript", "react", "angular", "vue", "node", "express", "django", "flask",
        "sql", "mysql", "postgresql", "mongodb", "redis", "cassandra", "aws", "azure", "gcp", "docker", "kubernetes",
        "jenkins", "terraform", "ansible", "linux", "git", "rest api", "graphql", "microservices", "machine learning",
        "deep learning", "nlp", "statistics", "tableau", "power bi", "agile", "scrum", "project management", "system design", 
        "data structures", "algorithms", "c++", "c#", "golang", "rust", "swift", "kotlin", "php", "ruby", "spark", "hadoop", 
        "kafka", "api", "ui/ux", "devops", "cloud", "frontend", "backend", "fullstack", "mobile", "ios", "android"
    ]
    text_lower = text.lower()
    found = set()
    for skill in skills:
        # Simple word boundary check
        if re.search(rf'\b{re.escape(skill)}\b', text_lower):
            found.add(skill)
    return found

def heuristic_analysis(resume_text: str, jd_text: str, skills_resume: str, skills_jd: str):
    """
    Perform fast, deterministic heuristic analysis for the objective parts of the score.
    Returns scores out of 100 for each sub-category.
    """
    res_lower = resume_text.lower()
    jd_lower = jd_text.lower()
    
    # 1. Keyword / Skill Match (0-35 points total weight later)
    sr = _skills_set(skills_resume) or _extract_skills_heuristically(resume_text)
    sj = _skills_set(skills_jd) or _extract_skills_heuristically(jd_text)
    
    if sj:
        skill_match_pct = len(sr & sj) / max(len(sj), 1) * 100
    else:
        # If no specific JD skills, fallback to word overlap
        stop_words = {"the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "with", "is", "of"}
        rw = set(w for w in res_lower.split() if w not in stop_words and len(w) > 2)
        jw = set(w for w in jd_lower.split() if w not in stop_words and len(w) > 2)
        skill_match_pct = (len(rw & jw) / max(len(jw), 1)) * 100 if jw else 50.0

    skill_match_pct = min(100.0, skill_match_pct * 1.2) # Generous curve
    
    # 2. Format & Completeness (0-30 points total weight later)
    sections = ['experience', 'education', 'skills', 'summary', 'projects']
    sections_found = sum(1 for s in sections if s in res_lower)
    section_score = (sections_found / 5.0) * 100
    
    bullets = resume_text.count('•') + resume_text.count('-') + resume_text.count('*')
    bullet_score = min(100.0, (bullets / 15.0) * 100) # 15 bullets is "perfect"
    
    word_count = len(resume_text.split())
    # Ideal word count: 300 - 800 words
    if 300 <= word_count <= 800:
        length_score = 100.0
    elif word_count < 300:
        length_score = max(0.0, (word_count / 300.0) * 100)
    else:
        length_score = max(0.0, 100 - ((word_count - 800) / 10.0))
        
    format_score = (section_score * 0.5) + (bullet_score * 0.3) + (length_score * 0.2)
    
    return {
        "keyword_score": round(skill_match_pct, 1),
        "format_score": round(format_score, 1),
        "metrics": {
            "resume_skills_count": len(sr),
            "jd_skills_count": len(sj),
            "sections_found": sections_found,
            "word_count": word_count,
            "bullet_count": bullets
        }
    }

def llm_impact_analysis(resume_text: str, jd_text: str):
    """
    Use LLM to evaluate the subjective quality: impact, metrics, and tone.
    (0-35 points total weight later)
    """
    prompt = f"""Evaluate this resume's impact and phrasing against the job description.
Do NOT evaluate keyword matching or formatting. Focus ONLY on:
1. Impact & Metrics: Do they use numbers to quantify results? (e.g., "Increased sales by 20%" vs "Helped with sales")
2. Action Verbs: Do they start bullets with strong verbs?
3. Relevance: Do their achievements actually sound relevant to the JD?

RESUME:
{resume_text[:2000]}

JD:
{jd_text[:1000]}

Return JSON strictly:
{{
    "impact_score": 0-100,
    "strengths": ["1-2 brief sentences on what reads well"],
    "weaknesses": ["1-2 brief sentences on what sounds weak/vague"]
}}
"""
    result = _call_llm_json(prompt, system="You are an expert ATS and recruiter AI. Evaluate resume impact.")
    
    if not result or "impact_score" not in result:
        # Fallback if LLM fails
        return {"impact_score": 70, "strengths": ["Clear phrasing"], "weaknesses": ["Could use more quantified metrics"]}
        
    return result

def score_resume(resume_text: str, jd: str, skills_resume="", skills_jd="", years_resume=0, years_jd=0):
    """
    Main entrypoint for scoring.
    Combines Heuristics (Keywords, Format) + LLM (Impact) for a transparent 100-point score.
    """
    try:
        jd_text = jd.strip() or GENERAL_JD_TEXT
        
        # 1. Get deterministic heuristic scores
        heuristics = heuristic_analysis(resume_text, jd_text, skills_resume, skills_jd)
        
        # 2. Get LLM subjective impact score
        impact = llm_impact_analysis(resume_text, jd_text)
        
        # 3. Final Composition
        # Weights: 35% Keywords, 30% Format, 35% Impact
        keyword_weighted = heuristics["keyword_score"] * 0.35
        format_weighted = heuristics["format_score"] * 0.30
        impact_weighted = impact["impact_score"] * 0.35
        
        final_score = int(keyword_weighted + format_weighted + impact_weighted)
        
        # 4. Generate transparent breakdown & radar data
        breakdown = {
            "total_score": final_score,
            "keyword_match": heuristics["keyword_score"],
            "format_readability": heuristics["format_score"],
            "impact_metrics": impact["impact_score"]
        }
        
        radar_data = [
            {"subject": "Keywords", "A": heuristics["keyword_score"], "fullMark": 100},
            {"subject": "Formatting", "A": heuristics["format_score"], "fullMark": 100},
            {"subject": "Impact", "A": impact["impact_score"], "fullMark": 100},
            {"subject": "Length", "A": 100 if 300 <= heuristics["metrics"]["word_count"] <= 800 else 60, "fullMark": 100},
            {"subject": "Relevance", "A": min(100, (heuristics["keyword_score"] + impact["impact_score"])/2 + 10), "fullMark": 100}
        ]
        
        # Determine levels for UI
        def get_level(score):
            if score >= 80: return "Excellent"
            if score >= 60: return "Good"
            if score >= 40: return "Standard"
            return "Needs Improvement"
            
        tech_metrics = {
            "keyword_match_level": get_level(heuristics["keyword_score"]),
            "section_completeness": f"{heuristics['metrics']['sections_found']}/5",
            "formatting_level": get_level(heuristics["format_score"]),
            "resume_len": heuristics["metrics"]["word_count"],
            "resume_skills": list(_skills_set(skills_resume) or _extract_skills_heuristically(resume_text))
        }
        
        # Suggestions
        suggestions = impact["weaknesses"]
        if heuristics["metrics"]["sections_found"] < 4:
            suggestions.append("Ensure you have clear Experience, Education, and Skills sections.")
        if heuristics["metrics"]["bullet_count"] < 5:
            suggestions.append("Use more bullet points to make your experience easy to read.")
        if heuristics["keyword_score"] < 50:
            suggestions.append("Your resume is missing key skills mentioned in the job description.")
            
        # Add some default role alignment based on score
        role_alignment = {
            "Target Role": final_score,
            "Adjacent Role": max(0, final_score - 15),
            "Junior Role": min(100, final_score + 10)
        }

        return {
            "score": final_score,
            "breakdown": breakdown,
            "technical_metrics": tech_metrics,
            "gemini_suggestions": suggestions,
            "radar_data": radar_data,
            "role_alignment": role_alignment,
            "error": None
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "score": 50,
            "breakdown": {"error": "Scoring failed, returned default"},
            "technical_metrics": {},
            "gemini_suggestions": ["An error occurred while analyzing your resume."],
            "radar_data": [],
            "role_alignment": {},
            "error": str(e)
        }
