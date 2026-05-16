"""
Alex — SmartResume Career Mentor Agent
A context-aware, tool-using career mentor that knows everything about the user
and proactively tracks + supports their career journey.
"""
import json
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

# ── Alex's Persona ────────────────────────────────────────────────────────────

ALEX_PERSONA = """You are Alex, an elite personal career mentor and senior software engineer with 10+ years helping candidates land roles at top tech companies (Google, Meta, Amazon, Microsoft, etc.).

Your personality:
- Direct and honest — you tell users exactly what's wrong and what to fix, no sugarcoating
- Proactive — you notice patterns, call out slipping streaks, push users before they ask
- Warm but efficient — you care deeply about their success, not small talk
- Data-driven — you back every observation with numbers from their ACTUAL data
- Action-oriented — every response ends with 1-3 concrete, specific next steps

Style rules:
- Never open with "How can I help?" — you already know their context
- Use bullet points for action items
- Reference specific numbers (score: 62/100, streak: 3 days, etc.)
- If streak is breaking, call it out immediately with urgency
- If a job has been stagnant 2+ weeks, flag it
- If no resume analyzed yet, push them to do it first — everything else depends on it
- Keep responses tight — max 250 words unless generating a document"""

# ── Context Builder ───────────────────────────────────────────────────────────

def build_user_context(user, db) -> Dict:
    """Load comprehensive user career context."""
    from database import Analysis, DSATrack, JobApplication, GitHubProfile, CodingRoadmap

    ctx = {
        "username": user.username,
        "member_since": user.created_at.strftime("%B %Y") if user.created_at else "recently",
        "resume": None, "dsa": None, "jobs": None, "github": None, "roadmap": None,
    }

    # Resume
    analysis = db.query(Analysis).filter(
        Analysis.user_id == user.id
    ).order_by(Analysis.created_at.desc()).first()

    if analysis:
        ctx["resume"] = {
            "score": analysis.ats_score,
            "breakdown": analysis.score_breakdown or {},
            "suggestions": (analysis.suggestions or [])[:3],
            "days_ago": (datetime.utcnow() - analysis.created_at).days,
            "jd_used": bool(analysis.jd_used),
            "resume_text_preview": (analysis.resume_text or "")[:800],
        }

    # DSA
    dsa_records = db.query(DSATrack).filter(DSATrack.user_id == user.id).all()
    if dsa_records:
        completed = [r for r in dsa_records if r.status == "done"]
        today = datetime.utcnow().date()
        calendar = {}
        for r in completed:
            if r.completed_at:
                k = r.completed_at.date().isoformat()
                calendar[k] = calendar.get(k, 0) + 1
        streak = 0
        cursor = today
        while calendar.get(cursor.isoformat(), 0) > 0:
            streak += 1
            cursor -= timedelta(days=1)
        yesterday = (today - timedelta(days=1)).isoformat()
        ctx["dsa"] = {
            "total_completed": len(completed),
            "current_streak": streak,
            "done_today": calendar.get(today.isoformat(), 0),
            "streak_at_risk": streak == 0 and calendar.get(yesterday, 0) > 0,
        }

    # Jobs
    apps = db.query(JobApplication).filter(
        JobApplication.user_id == user.id,
        JobApplication.is_active == True
    ).order_by(JobApplication.created_at.desc()).limit(10).all()

    if apps:
        stale = [
            f"{a.company} ({a.role}) — {(datetime.utcnow() - a.created_at).days}d, stage: {a.stage}"
            for a in apps
            if (datetime.utcnow() - a.created_at).days > 14 and a.stage not in ("offer", "rejected")
        ]
        stage_counts = {}
        for a in apps:
            stage_counts[a.stage] = stage_counts.get(a.stage, 0) + 1
        ctx["jobs"] = {
            "total": len(apps),
            "by_stage": stage_counts,
            "stale": stale[:3],
            "recent": [{"company": a.company, "role": a.role, "stage": a.stage} for a in apps[:5]],
        }

    # GitHub
    gh = db.query(GitHubProfile).filter(GitHubProfile.user_id == user.id).first()
    if gh:
        ctx["github"] = {
            "username": gh.github_username,
            "public_repos": gh.public_repos,
            "top_languages": list((gh.top_languages or {}).keys())[:4],
            "gaps": (gh.resume_gaps or [])[:3],
            "bonuses": (gh.github_bonuses or [])[:3],
        }

    # Roadmap
    roadmap = db.query(CodingRoadmap).filter(
        CodingRoadmap.user_id == user.id
    ).order_by(CodingRoadmap.updated_at.desc()).first()
    if roadmap:
        ctx["roadmap"] = {
            "target": roadmap.target_role,
            "progress_pct": roadmap.progress_pct,
            "completed": len(roadmap.completed_topics or []),
            "total": roadmap.total_topics,
        }

    return ctx


def _format_context(ctx: Dict) -> str:
    lines = [f"USER: @{ctx['username']} (joined {ctx['member_since']})\n"]

    if ctx["resume"]:
        r = ctx["resume"]
        bd = r["breakdown"]
        lines.append("RESUME:")
        lines.append(f"  Score: {r['score']}/100 (analyzed {r['days_ago']}d ago)")
        if bd:
            lines.append(f"  Keywords: {bd.get('keyword_match', '?')}/35 | Format: {bd.get('format_readability', '?')}/30 | Impact: {bd.get('impact_metrics', '?')}/35")
        if r["suggestions"]:
            lines.append(f"  Issues: {' | '.join(r['suggestions'][:2])}")
    else:
        lines.append("RESUME: ⚠️ None analyzed yet")

    if ctx["dsa"]:
        d = ctx["dsa"]
        lines.append(f"\nDSA: {d['total_completed']} solved | Streak: {d['current_streak']}d | Today: {d['done_today']} problems")
        if d["streak_at_risk"]:
            lines.append("  ⚠️ STREAK AT RISK — nothing solved today!")
    else:
        lines.append("\nDSA: No problems tracked")

    if ctx["jobs"]:
        j = ctx["jobs"]
        lines.append(f"\nJOBS: {j['total']} tracked | {j['by_stage']}")
        if j["stale"]:
            lines.append(f"  ⚠️ Stale: {j['stale'][0]}")
    else:
        lines.append("\nJOBS: No applications tracked")

    if ctx["github"]:
        g = ctx["github"]
        lines.append(f"\nGITHUB: @{g['username']} | {g['public_repos']} repos | {g['top_languages']}")
        if g["gaps"]:
            lines.append(f"  Resume gaps: {g['gaps']}")
        if g["bonuses"]:
            lines.append(f"  Hidden skills (add to resume!): {g['bonuses']}")

    if ctx["roadmap"]:
        rm = ctx["roadmap"]
        lines.append(f"\nROADMAP: {rm['target']} — {rm['progress_pct']:.0f}% ({rm['completed']}/{rm['total']} topics)")

    return "\n".join(lines)


# ── Tool Definitions & Executor ───────────────────────────────────────────────

TOOL_DESCRIPTIONS = {
    "get_user_status": "Pull full career dashboard: resume score, DSA streak, job pipeline",
    "analyze_resume_gaps": "Deep-dive on resume issues and specific improvement suggestions",
    "rewrite_bullet": "Rewrite a resume bullet in STAR format with metrics",
    "generate_cover_letter": "Write a tailored cover letter for a target role + company",
    "add_job_application": "Add a job to the user's tracker",
    "generate_roadmap": "Create personalized 8-week study plan for a target role + company",
}


def execute_tool(tool_name: str, args: Dict, user, db) -> str:
    from database import Analysis, JobApplication
    from services.llm_service import rewrite_bullet_point, generate_cover_letter, generate_dynamic_roadmap

    try:
        if tool_name == "get_user_status":
            ctx = build_user_context(user, db)
            return _format_context(ctx)

        elif tool_name == "analyze_resume_gaps":
            a = db.query(Analysis).filter(Analysis.user_id == user.id).order_by(Analysis.created_at.desc()).first()
            if not a:
                return "No resume analyzed yet. Go to Resume Lab and upload your PDF."
            return json.dumps({
                "score": a.ats_score,
                "breakdown": a.score_breakdown,
                "top_issues": (a.suggestions or [])[:5],
                "jd_used": bool(a.jd_used),
            }, indent=2)

        elif tool_name == "rewrite_bullet":
            bullet = args.get("bullet", "")
            role = args.get("role", "Software Engineer")
            if not bullet:
                return "Provide the bullet text to rewrite."
            rewrites = rewrite_bullet_point(bullet, role)
            return "Rewritten options:\n" + "\n".join(f"  {i+1}. {r}" for i, r in enumerate(rewrites))

        elif tool_name == "generate_cover_letter":
            a = db.query(Analysis).filter(Analysis.user_id == user.id).order_by(Analysis.created_at.desc()).first()
            if not a:
                return "Analyze your resume first."
            resume_text = (a.resume_text or a.resume_preview or "")
            jd = f"Role: {args.get('role', 'Software Engineer')} at {args.get('company', 'the company')}"
            return generate_cover_letter(resume_text, jd)

        elif tool_name == "add_job_application":
            company = args.get("company", "")
            role = args.get("role", "")
            if not company or not role:
                return "Missing company or role name."
            app = JobApplication(
                user_id=user.id, company=company, role=role,
                stage=args.get("stage", "applied"),
                job_url=args.get("url") or None,
                date_applied=datetime.utcnow(),
            )
            db.add(app)
            db.commit()
            return f"✅ Added '{role}' at '{company}' to your job tracker (stage: {app.stage})."

        elif tool_name == "generate_roadmap":
            a = db.query(Analysis).filter(Analysis.user_id == user.id).order_by(Analysis.created_at.desc()).first()
            if not a:
                return "Analyze your resume first."
            resume_text = (a.resume_text or a.resume_preview or "")
            role = args.get("role", "Software Engineer")
            company = args.get("company", "Top Tech Company")
            rm = generate_dynamic_roadmap(resume_text, role, company)
            phases = rm.get("phases", [])
            out = f"8-Week Plan: {role} @ {company}\n{rm.get('summary', '')}\n\n"
            for p in phases:
                out += f"• {p.get('week_label')}: {p.get('title')} — {p.get('focus')}\n"
            return out

        return f"Unknown tool: {tool_name}"
    except Exception as e:
        logger.error(f"Tool [{tool_name}] error: {e}")
        return f"Tool error: {str(e)}"


# ── Intent Detection ──────────────────────────────────────────────────────────

def _extract_company(msg: str) -> str:
    known = ["google", "amazon", "microsoft", "meta", "apple", "netflix", "uber",
             "airbnb", "stripe", "openai", "flipkart", "infosys", "tcs", "wipro"]
    ml = msg.lower()
    for c in known:
        if c in ml:
            return c.capitalize()
    for pat in [r'at\s+([A-Z][a-zA-Z]+)', r'for\s+([A-Z][a-zA-Z]+)', r'@\s*([A-Z][a-zA-Z]+)']:
        m = re.search(pat, msg)
        if m:
            return m.group(1)
    return ""


def _extract_role(msg: str) -> str:
    roles = ["sde", "software engineer", "backend engineer", "frontend engineer",
             "full stack", "data scientist", "ml engineer", "product manager", "devops", "swe"]
    ml = msg.lower()
    for r in roles:
        if r in ml:
            return r.title()
    return "Software Engineer"


def _pick_tools(message: str) -> List[Dict]:
    ml = message.lower()
    tools = []

    status_kw = ["how am i", "what should i", "today", "progress", "status", "summary",
                 "hi", "hello", "hey", "overview", "check in", "update"]
    if any(k in ml for k in status_kw):
        tools.append({"tool": "get_user_status", "args": {}})

    resume_kw = ["resume", "cv", "score", "ats", "bullet", "improve", "fix", "weak", "gap", "keyword", "suggestion"]
    if any(k in ml for k in resume_kw):
        tools.append({"tool": "analyze_resume_gaps", "args": {}})

    if "rewrite" in ml and any(k in ml for k in ["bullet", "point", "line"]):
        tools.append({"tool": "rewrite_bullet", "args": {"bullet": message, "role": _extract_role(message)}})

    if "cover letter" in ml or "cover email" in ml:
        tools.append({"tool": "generate_cover_letter", "args": {
            "company": _extract_company(message), "role": _extract_role(message)
        }})

    add_kw = ["add", "track", "applied to", "applied at", "apply to", "log this"]
    job_kw = ["job", "role", "position", "application", "internship", "offer"]
    if any(k in ml for k in add_kw) and any(k in ml for k in job_kw):
        tools.append({"tool": "add_job_application", "args": {
            "company": _extract_company(message), "role": _extract_role(message)
        }})

    roadmap_kw = ["roadmap", "plan", "prepare for", "get into", "land at", "study plan"]
    if any(k in ml for k in roadmap_kw):
        tools.append({"tool": "generate_roadmap", "args": {
            "company": _extract_company(message) or "Top Tech Company",
            "role": _extract_role(message),
        }})

    # Deduplicate
    seen, unique = set(), []
    for t in tools:
        if t["tool"] not in seen:
            seen.add(t["tool"])
            unique.append(t)

    return unique[:3]


# ── Main Agent Loop ───────────────────────────────────────────────────────────

def run_agent(
    user_message: str,
    user,
    db,
    conversation_history: List[Dict],
    is_init: bool = False,
) -> Tuple[str, List[str]]:
    """
    Core ReAct-style agent loop.
    Returns (response_text, tools_used_list).
    """
    from services.llm_service import _call_llm

    # Build context
    ctx = build_user_context(user, db)
    ctx_str = _format_context(ctx)

    # Pick and execute tools
    tools_to_run = _pick_tools(user_message) if not is_init else [{"tool": "get_user_status", "args": {}}]
    tools_used = []
    tool_results = []

    for tc in tools_to_run:
        result = execute_tool(tc["tool"], tc["args"], user, db)
        tools_used.append(tc["tool"])
        tool_results.append(f"[{tc['tool']}]:\n{result}")

    # Build history string (last 8 turns)
    history_str = "\n".join(
        f"{'User' if m['role'] == 'user' else 'Alex'}: {m['content'][:400]}"
        for m in conversation_history[-8:]
    ) if conversation_history else "No previous messages."

    tool_block = "\n\n".join(tool_results) if tool_results else ""

    if is_init:
        prompt = f"""{ALEX_PERSONA}

LIVE USER DATA:
{ctx_str}

{f'TOOL DATA:{chr(10)}{tool_block}' if tool_block else ''}

This is your FIRST message to this user. Introduce yourself as Alex in ONE sentence, then immediately give a sharp status assessment using their real numbers.

Rules:
- If resume analyzed: state the score, flag the weakest area, give 2 priority fixes
- If no resume: tell them to go upload it in Resume Lab right now — nothing else matters yet
- If DSA streak is at risk: call it out with urgency
- If stale jobs exist: mention them
- Close with: "What's your target role and company? Tell me and I'll build your exact game plan."
- Max 200 words."""
    else:
        prompt = f"""{ALEX_PERSONA}

LIVE USER DATA:
{ctx_str}

{f'TOOL RESULTS:{chr(10)}{tool_block}' if tool_block else ''}

CONVERSATION HISTORY:
{history_str}

User: "{user_message}"

Respond as Alex. Be specific — reference real numbers from the data. If a tool ran, weave results in naturally. End with 1-3 next actions if relevant. Max 250 words."""

    response = _call_llm(
        prompt,
        system="You are Alex, an elite career mentor. Always use the user's real data. Be direct, specific, never generic."
    )

    if not response:
        response = "I'm having a brief connectivity issue — try again in a moment. Meanwhile, if your DSA streak is at risk, go solve one problem right now!"

    return response, tools_used
