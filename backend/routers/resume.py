import logging
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from database import User, Analysis, ResumeProfile, get_db
from auth import get_current_user
from parser_module import extract_text_from_pdfbytes
from scorer_final import GENERAL_JD_TEXT, score_resume
from security_utils import encrypt_resume_text
from utils.limiter import limiter
from utils.resume_utils import (
    build_resume_preview,
    get_analysis_resume_text,
    get_analysis_resume_preview,
    builder_content_to_resume_text,
    MAX_RESUME_FILE_SIZE,
    UPLOAD_CHUNK_SIZE,
)
from utils.activity import log_user_activity

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Resume Lab"])


async def read_upload_with_limit(file: UploadFile, max_size: int = MAX_RESUME_FILE_SIZE) -> bytes:
    """Read an uploaded file in chunks and enforce the server-side size limit."""
    chunks = []
    total_size = 0

    while True:
        chunk = await file.read(UPLOAD_CHUNK_SIZE)
        if not chunk:
            break

        total_size += len(chunk)
        if total_size > max_size:
            raise HTTPException(
                status_code=413,
                detail="Resume PDF must be 10 MB or smaller.",
            )

        chunks.append(chunk)

    return b"".join(chunks)


@router.post(
    "/analyze",
    summary="Deep Resume Analysis",
    description="Uploads a PDF resume and runs it through the hybrid Heuristic + LLM scoring engine for comprehensive 7-dimension scoring with reasoning.",
)
@limiter.limit("5/minute")
async def analyze_resume(
    request: Request,
    file: UploadFile,
    jd: str = Form(""),
    years: float = Form(0.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze resume with hybrid Heuristic + LLM engine."""
    if not file:
        raise HTTPException(status_code=400, detail="Resume PDF is required.")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        content = await read_upload_with_limit(file)
        resume_text = extract_text_from_pdfbytes(content) or "No text extracted."
        if len(resume_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract meaningful text from PDF")

        jd_text = jd.strip() or GENERAL_JD_TEXT

        # Score resume — scorer handles heuristics + LLM internally
        score_result = score_resume(resume_text, jd_text)

        ats_score = score_result.get("score", 0)
        suggestions = score_result.get("gemini_suggestions", [])

        # Calculate score difference from previous analysis
        prev_analysis = (
            db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
        )
        score_diff = (ats_score - prev_analysis.ats_score) if prev_analysis else 0
        previous_score = prev_analysis.ats_score if prev_analysis else 0

        resume_preview = build_resume_preview(resume_text)

        # Save to database
        analysis = Analysis(
            user_id=current_user.id,
            resume_text=encrypt_resume_text(resume_text),
            resume_preview=resume_preview,
            jd_used=jd_text[:500] if jd.strip() else None,
            ats_score=int(ats_score),
            score_breakdown=score_result.get("breakdown", {}),
            keyword_gaps=score_result.get("technical_metrics", {}),
            suggestions=suggestions,
            radar_data=score_result.get("radar_data", []),
            role_alignment=score_result.get("role_alignment", {}),
            full_report=score_result.get("full_report", {}),
        )
        db.add(analysis)
        log_user_activity(
            db,
            current_user.id,
            "resume",
            note=f"Analyzed resume{' for JD' if jd.strip() else ''}",
        )
        db.commit()

        return {
            "ats_score": ats_score,
            "score_details": score_result,
            "full_report": score_result.get("full_report", {}),
            "resume_preview": resume_preview,
            "jd_used": bool(jd.strip()),
            "score_diff": score_diff,
            "previous_score": previous_score,
            "suggestions": suggestions,
            "gemini_available": score_result.get("gemini_available", False),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/guest-analyze-resume/")
@limiter.limit("2/minute")
async def guest_analyze_resume(
    request: Request,
    file: UploadFile,
    jd: str = Form(""),
    years: float = Form(0.0),
):
    """Guest analysis endpoint without authentication or history."""
    if not file:
        raise HTTPException(status_code=400, detail="Resume PDF is required.")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        content = await read_upload_with_limit(file)
        resume_text = extract_text_from_pdfbytes(content) or "No text extracted."
        if len(resume_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract meaningful text from PDF")

        jd_text = jd.strip() or GENERAL_JD_TEXT
        score_result = score_resume(resume_text, jd_text)

        ats_score = score_result.get("score", 0)
        suggestions = score_result.get("gemini_suggestions", [])

        return {
            "ats_score": ats_score,
            "score_details": score_result,
            "full_report": score_result.get("full_report", {}),
            "resume_preview": build_resume_preview(resume_text),
            "jd_used": bool(jd.strip()),
            "suggestions": suggestions,
            "gemini_available": score_result.get("gemini_available", False),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post(
    "/generate-cover-letter",
    summary="Generate AI Cover Letter",
    description="Generates a professional, tailored cover letter based on the user's latest resume analysis.",
)
@limiter.limit("5/minute")
async def api_generate_cover_letter(
    request: Request, jd: str = Form(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(
            status_code=400,
            detail="No resume analysis found. Please upload and analyze your resume in the Dashboard first.",
        )

    from services.llm_service import generate_cover_letter

    cover_letter = generate_cover_letter(get_analysis_resume_text(latest), jd)
    return {"cover_letter": cover_letter}


@router.post(
    "/generate-interview-prep",
    summary="Generate Interview Questions",
    description="Generates tailored interview questions and winning tips based on the user's resume and a target job description.",
)
@limiter.limit("5/minute")
async def api_generate_interview_prep(
    request: Request, jd: str = Form(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(
            status_code=400,
            detail="No resume analysis found. Please upload and analyze your resume in the Dashboard first.",
        )

    from services.llm_service import generate_interview_questions

    questions = generate_interview_questions(get_analysis_resume_text(latest), jd)
    return {"interview_prep": questions}


@router.post(
    "/analyze/rewrite",
    summary="Rewrite Resume Bullet",
    description="Generates a fixed, ATS-optimized bullet point based on a detected flaw.",
)
@limiter.limit("10/minute")
async def api_rewrite_bullet(
    request: Request,
    flaw: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="No resume analysis found.")

    from services.llm_service import rewrite_bullet

    rewritten = rewrite_bullet(flaw, get_analysis_resume_text(latest))
    return {"rewritten_bullet": rewritten}


@router.get("/history")
async def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    analyses = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .limit(20)
        .all()
    )
    return {
        "analyses": [
            {
                "id": a.id,
                "ats_score": a.ats_score,
                "created_at": a.created_at.isoformat(),
                "resume_preview": get_analysis_resume_preview(a),
                "jd_used": (a.jd_used[:200] + "...") if a.jd_used else None,
            }
            for a in analyses
        ]
    }


@router.post("/resume/rewrite-bullet")
@limiter.limit("10/minute")
async def rewrite_bullet(
    request: Request, bullet: str = Form(...), role: str = Form(""), current_user: User = Depends(get_current_user)
):
    from services.llm_service import rewrite_bullet_point

    return {"rewrites": rewrite_bullet_point(bullet, role)}


@router.post("/resume/keyword-heatmap")
@limiter.limit("10/minute")
async def keyword_heatmap(
    request: Request, jd: str = Form(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze a resume first.")
    from services.llm_service import generate_keyword_heatmap

    return generate_keyword_heatmap(get_analysis_resume_text(latest), jd)


@router.post("/resume/parse-pdf")
@limiter.limit("10/minute")
async def parse_pdf_to_builder(
    request: Request, file: UploadFile = File(...), current_user: User = Depends(get_current_user)
):
    """Parses an uploaded PDF directly into the ResumeBuilder JSON format."""
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        content = await read_upload_with_limit(file)
        import io
        import PyPDF2

        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = "".join(page.extract_text() or "" for page in pdf_reader.pages)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        from services.llm_service import parse_resume_to_builder

        parsed_data = parse_resume_to_builder(text)
        return parsed_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to parse PDF for builder: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse PDF")


@router.get("/resume/load")
async def load_resume_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Load the latest saved resume profile for the builder."""
    profile = (
        db.query(ResumeProfile)
        .filter(ResumeProfile.user_id == current_user.id)
        .order_by(ResumeProfile.updated_at.desc())
        .first()
    )

    if not profile:
        return {"content": None}

    return {"id": profile.id, "title": profile.title, "content": profile.content}


@router.post("/resume/save")
async def save_resume_profile(
    request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Save resume profile content from the builder."""
    data = await request.json()
    content = data.get("content")
    title = data.get("title", "My Resume")

    if not content:
        raise HTTPException(status_code=400, detail="content required")

    profile = (
        db.query(ResumeProfile)
        .filter(ResumeProfile.user_id == current_user.id)
        .order_by(ResumeProfile.updated_at.desc())
        .first()
    )

    if profile:
        profile.content = content
        profile.title = title
    else:
        profile = ResumeProfile(user_id=current_user.id, title=title, content=content)
        db.add(profile)

    db.commit()
    db.refresh(profile)

    return {"success": True, "id": profile.id}


@router.post("/resume/analyze-builder")
@limiter.limit("10/minute")
async def analyze_builder_resume(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze the current Resume Builder content without requiring a PDF upload."""
    data = await request.json()
    content = data.get("content")
    jd = (data.get("jd") or "").strip()

    resume_text = builder_content_to_resume_text(content)
    if len(resume_text.strip()) < 80:
        raise HTTPException(status_code=400, detail="Add more resume content before analyzing from the builder.")

    jd_text = jd or GENERAL_JD_TEXT
    score_result = score_resume(resume_text, jd_text)
    ats_score = score_result.get("score", 0)
    suggestions = score_result.get("gemini_suggestions", [])

    prev_analysis = (
        db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    )
    score_diff = (ats_score - prev_analysis.ats_score) if prev_analysis else 0
    previous_score = prev_analysis.ats_score if prev_analysis else 0

    resume_preview = build_resume_preview(resume_text)
    analysis = Analysis(
        user_id=current_user.id,
        resume_text=encrypt_resume_text(resume_text),
        resume_preview=resume_preview,
        jd_used=jd_text[:500] if jd else None,
        ats_score=int(ats_score),
        score_breakdown=score_result.get("breakdown", {}),
        keyword_gaps=score_result.get("technical_metrics", {}),
        suggestions=suggestions,
        radar_data=score_result.get("radar_data", []),
        role_alignment=score_result.get("role_alignment", {}),
    )
    db.add(analysis)
    log_user_activity(
        db,
        current_user.id,
        "resume",
        note=f"Analyzed builder resume{' for JD' if jd else ''}",
    )
    db.commit()

    return {
        "ats_score": ats_score,
        "score_details": score_result,
        "full_report": score_result.get("full_report", {}),
        "resume_preview": resume_preview,
        "jd_used": bool(jd),
        "score_diff": score_diff,
        "previous_score": previous_score,
        "suggestions": suggestions,
        "gemini_available": score_result.get("gemini_available", False),
        "source": "builder",
    }
