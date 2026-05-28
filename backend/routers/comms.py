from fastapi import APIRouter, Depends, Form, HTTPException, Request
from sqlalchemy.orm import Session

from database import User, Analysis, get_db
from auth import get_current_user
from utils.limiter import limiter
from utils.resume_utils import get_analysis_resume_text

router = APIRouter(tags=["Communication Assistant"])


@router.post("/comms/language-audit")
@limiter.limit("10/minute")
async def language_audit(
    request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze a resume first.")
    from services.llm_service import audit_resume_language

    return audit_resume_language(get_analysis_resume_text(latest))


@router.post("/comms/elevator-pitch")
@limiter.limit("10/minute")
async def elevator_pitch(
    request: Request,
    target_role: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze a resume first.")
    from services.llm_service import generate_elevator_pitch

    return {"pitch": generate_elevator_pitch(get_analysis_resume_text(latest), target_role)}


@router.post("/comms/linkedin-headline")
@limiter.limit("10/minute")
async def linkedin_headline(
    request: Request,
    target_role: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze a resume first.")
    from services.llm_service import generate_linkedin_headlines

    return {"headlines": generate_linkedin_headlines(get_analysis_resume_text(latest), target_role)}


@router.post("/comms/cold-email")
@limiter.limit("10/minute")
async def cold_email(
    request: Request,
    company: str = Form(...),
    role: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if not latest:
        raise HTTPException(status_code=400, detail="Analyze a resume first.")
    from services.llm_service import generate_cold_email

    return {"email": generate_cold_email(get_analysis_resume_text(latest), company, role)}
