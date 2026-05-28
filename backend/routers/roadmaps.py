import hashlib
from fastapi import APIRouter, Depends, Form, HTTPException, Request
from sqlalchemy.orm import Session

from database import User, CodingRoadmap, Analysis, LLMCache, get_db
from auth import get_current_user
from utils.limiter import limiter
from utils.resume_utils import get_analysis_resume_text
from utils.activity import log_user_activity

router = APIRouter(tags=["Roadmaps"])

def _cache_key(*args: str) -> str:
    combined = "|".join(str(a)[:500] for a in args)
    return hashlib.md5(combined.encode()).hexdigest()


ROLEMAP = {
    "Software Engineer": [
        "arrays",
        "strings",
        "linked-list",
        "stack",
        "queue",
        "trees",
        "graphs",
        "dynamic-programming",
        "backtracking",
        "system-design",
    ],
    "Frontend Engineer": [
        "arrays",
        "strings",
        "hash-table",
        "sliding-window",
        "recursion",
        "trees",
        "sorting",
        "bit-manipulation",
        "system-design",
    ],
    "Data Scientist": [
        "arrays",
        "math",
        "statistics",
        "sorting",
        "matrix",
        "dynamic-programming",
        "graphs",
        "probability",
    ],
    "Backend Engineer": [
        "arrays",
        "hash-table",
        "linked-list",
        "trees",
        "graphs",
        "dynamic-programming",
        "system-design",
        "database",
    ],
    "DevOps Engineer": ["arrays", "strings", "hash-table", "graphs", "system-design", "network"],
    "Mobile Developer": ["arrays", "strings", "trees", "graphs", "dynamic-programming", "concurrency"],
    "Full Stack Engineer": ["arrays", "hash-table", "trees", "graphs", "dynamic-programming", "system-design"],
    "Product Manager": ["sql", "statistics", "probability", "arrays", "math"],
}

LEETCODE_TOPICS = {
    "arrays": {
        "label": "Arrays & Hashing",
        "url": "https://leetcode.com/tag/array/",
        "neetcode": "https://neetcode.io/",
        "weeks": 1,
    },
    "strings": {
        "label": "Strings",
        "url": "https://leetcode.com/tag/string/",
        "neetcode": "https://neetcode.io/",
        "weeks": 1,
    },
    "sliding-window": {
        "label": "Sliding Window",
        "url": "https://leetcode.com/tag/sliding-window/",
        "neetcode": "https://neetcode.io/",
        "weeks": 1,
    },
    "hash-table": {
        "label": "Hash Tables",
        "url": "https://leetcode.com/tag/hash-table/",
        "neetcode": "https://neetcode.io/",
        "weeks": 1,
    },
    "linked-list": {
        "label": "Linked Lists",
        "url": "https://leetcode.com/tag/linked-list/",
        "neetcode": "https://neetcode.io/",
        "weeks": 2,
    },
    "stack": {
        "label": "Stack & Queue",
        "url": "https://leetcode.com/tag/stack/",
        "neetcode": "https://neetcode.io/",
        "weeks": 2,
    },
    "queue": {
        "label": "Queue",
        "url": "https://leetcode.com/tag/queue/",
        "neetcode": "https://neetcode.io/",
        "weeks": 2,
    },
    "recursion": {
        "label": "Recursion",
        "url": "https://leetcode.com/tag/recursion/",
        "neetcode": "https://neetcode.io/",
        "weeks": 2,
    },
    "trees": {
        "label": "Binary Trees",
        "url": "https://leetcode.com/tag/binary-tree/",
        "neetcode": "https://neetcode.io/",
        "weeks": 3,
    },
    "graphs": {
        "label": "Graphs",
        "url": "https://leetcode.com/tag/graph/",
        "neetcode": "https://neetcode.io/",
        "weeks": 4,
    },
    "dynamic-programming": {
        "label": "Dynamic Programming",
        "url": "https://leetcode.com/tag/dynamic-programming/",
        "neetcode": "https://neetcode.io/",
        "weeks": 5,
    },
    "backtracking": {
        "label": "Backtracking",
        "url": "https://leetcode.com/tag/backtracking/",
        "neetcode": "https://neetcode.io/",
        "weeks": 5,
    },
    "sorting": {
        "label": "Sorting Algorithms",
        "url": "https://leetcode.com/tag/sorting/",
        "neetcode": "https://neetcode.io/",
        "weeks": 3,
    },
    "system-design": {
        "label": "System Design",
        "url": "https://github.com/donnemartin/system-design-primer",
        "neetcode": "https://neetcode.io/courses/system-design-for-beginners",
        "weeks": 6,
    },
    "bit-manipulation": {
        "label": "Bit Manipulation",
        "url": "https://leetcode.com/tag/bit-manipulation/",
        "neetcode": "https://neetcode.io/",
        "weeks": 4,
    },
    "matrix": {
        "label": "Matrix",
        "url": "https://leetcode.com/tag/matrix/",
        "neetcode": "https://neetcode.io/",
        "weeks": 3,
    },
    "math": {"label": "Math", "url": "https://leetcode.com/tag/math/", "neetcode": "https://neetcode.io/", "weeks": 2},
    "statistics": {
        "label": "Statistics",
        "url": "https://www.khanacademy.org/math/statistics-probability",
        "neetcode": None,
        "weeks": 2,
    },
    "probability": {
        "label": "Probability",
        "url": "https://www.khanacademy.org/math/statistics-probability",
        "neetcode": None,
        "weeks": 3,
    },
    "sql": {"label": "SQL & Databases", "url": "https://leetcode.com/tag/database/", "neetcode": None, "weeks": 2},
    "database": {"label": "Database Design", "url": "https://leetcode.com/tag/database/", "neetcode": None, "weeks": 3},
    "concurrency": {
        "label": "Concurrency",
        "url": "https://leetcode.com/tag/concurrency/",
        "neetcode": None,
        "weeks": 5,
    },
    "network": {
        "label": "Networking Basics",
        "url": "https://www.youtube.com/watch?v=qiQR5rTSshw",
        "neetcode": None,
        "weeks": 4,
    },
}


@router.post("/roadmap/coding")
async def generate_coding_roadmap(
    role: str = Form(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    topics = ROLEMAP.get(role, ROLEMAP["Software Engineer"])
    weeks: dict = {}
    for t in topics:
        info = LEETCODE_TOPICS.get(t, {})
        w = str(info.get("weeks", 1))
        weeks.setdefault(w, []).append(
            {
                "id": t,
                "label": info.get("label", t.title()),
                "url": info.get("url"),
                "neetcode": info.get("neetcode"),
                "done": False,
            }
        )

    roadmap_data = {"role": role, "weeks": weeks}
    total_topics = len(topics)

    existing = (
        db.query(CodingRoadmap)
        .filter(CodingRoadmap.user_id == current_user.id, CodingRoadmap.target_role == role)
        .first()
    )
    if existing:
        existing.roadmap_data = roadmap_data
        existing.total_topics = total_topics
        existing.completed_topics = existing.completed_topics or []
    else:
        existing = CodingRoadmap(
            user_id=current_user.id,
            target_role=role,
            roadmap_data=roadmap_data,
            total_topics=total_topics,
            completed_topics=[],
            progress_pct=0.0,
        )
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return {
        "id": existing.id,
        "role": role,
        "roadmap": roadmap_data,
        "total_topics": total_topics,
        "progress_pct": existing.progress_pct,
    }


@router.get("/roadmap/coding")
async def get_coding_roadmap(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roadmaps = db.query(CodingRoadmap).filter(CodingRoadmap.user_id == current_user.id).all()
    return [
        {
            "id": r.id,
            "role": r.target_role,
            "progress_pct": r.progress_pct,
            "total_topics": r.total_topics,
            "completed": len(r.completed_topics or []),
            "roadmap": r.roadmap_data,
        }
        for r in roadmaps
    ]


@router.patch("/roadmap/coding/{roadmap_id}/progress")
async def update_roadmap_progress(
    roadmap_id: int,
    topic_id: str = Form(...),
    done: bool = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    roadmap = (
        db.query(CodingRoadmap).filter(CodingRoadmap.id == roadmap_id, CodingRoadmap.user_id == current_user.id).first()
    )
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")

    completed = list(roadmap.completed_topics or [])
    if done and topic_id not in completed:
        completed.append(topic_id)
    elif not done and topic_id in completed:
        completed.remove(topic_id)

    roadmap.completed_topics = completed
    roadmap.progress_pct = round(len(completed) / max(roadmap.total_topics, 1) * 100, 1)
    db.commit()
    return {"progress_pct": roadmap.progress_pct, "completed": completed}


@router.post(
    "/roadmap/ai-generate",
    summary="Generate Personalized AI Roadmap",
    description="Generates a dynamic 8-week roadmap tailored to the user's resume gaps, target role, and target company.",
)
@limiter.limit("5/minute")
async def generate_ai_roadmap(
    request: Request,
    target_role: str = Form(...),
    target_company: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates a personalized learning roadmap using Gemini/Groq based on the
    user's latest resume analysis, their target role (e.g. SDE), and target company (e.g. Google).
    """
    # Fetch the user's most recent resume text
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()

    resume_text = get_analysis_resume_text(latest)

    if not resume_text:
        raise HTTPException(
            status_code=400, detail="No resume found. Please upload and analyze your resume first in the Resume Lab."
        )

    from services.llm_service import generate_dynamic_roadmap

    # Check DB LLM cache first to avoid redundant API calls
    cache_key = _cache_key(resume_text[:500], target_role, target_company)
    cached_record = db.query(LLMCache).filter(LLMCache.prompt_hash == cache_key).first()
    if cached_record:
        roadmap_data = cached_record.response_payload
    else:
        roadmap_data = generate_dynamic_roadmap(resume_text, target_role, target_company)
        db.add(LLMCache(prompt_hash=cache_key, response_payload=roadmap_data))

    # Persist the roadmap to DB
    existing = (
        db.query(CodingRoadmap)
        .filter(
            CodingRoadmap.user_id == current_user.id, CodingRoadmap.target_role == f"{target_role} @ {target_company}"
        )
        .first()
    )

    if existing:
        existing.roadmap_data = roadmap_data
    else:
        existing = CodingRoadmap(
            user_id=current_user.id,
            target_role=f"{target_role} @ {target_company}",
            roadmap_data=roadmap_data,
            total_topics=len(roadmap_data.get("phases", [])),
            completed_topics=[],
            progress_pct=0.0,
        )
        db.add(existing)

    log_user_activity(
        db,
        current_user.id,
        "planning",
        note=f"Generated roadmap for {target_role} @ {target_company}",
    )
    db.commit()
    db.refresh(existing)

    return {
        "id": existing.id,
        "roadmap": roadmap_data,
        "target_role": target_role,
        "target_company": target_company,
    }
