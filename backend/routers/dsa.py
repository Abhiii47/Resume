from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import User, DSATrack, get_db
from auth import get_current_user
from utils.activity import log_user_activity

router = APIRouter(tags=["DSA Tracker"])


@router.get("/dsa/progress")
async def get_dsa_progress(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get progress plus streak and contribution data for the DSA tracker."""
    records = db.query(DSATrack).filter(DSATrack.user_id == current_user.id).all()
    progress = {r.problem_id: r.status for r in records}
    calendar = {}

    for record in records:
        if record.status != "done" or not record.completed_at:
            continue
        day_key = record.completed_at.date().isoformat()
        calendar[day_key] = calendar.get(day_key, 0) + 1

    today = datetime.now(timezone.utc).date()
    current_streak = 0
    cursor = today
    while calendar.get(cursor.isoformat(), 0) > 0:
        current_streak += 1
        cursor -= timedelta(days=1)

    return {
        "progress": progress,
        "calendar": calendar,
        "stats": {
            "completed_total": sum(1 for record in records if record.status == "done"),
            "today_completed": calendar.get(today.isoformat(), 0),
            "current_streak": current_streak,
        },
    }


@router.post("/dsa/progress")
async def update_dsa_progress(
    request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Update progress for a single problem."""
    data = await request.json()
    problem_id = data.get("problem_id")
    platform = data.get("platform", "neetcode")
    status = data.get("status", "done")

    if not problem_id:
        raise HTTPException(status_code=400, detail="problem_id required")

    track = db.query(DSATrack).filter(DSATrack.user_id == current_user.id, DSATrack.problem_id == problem_id).first()

    if track:
        previously_done = track.status == "done"
        track.status = status
        track.platform = platform
        track.completed_at = datetime.now(timezone.utc) if status == "done" else None
    else:
        previously_done = False
        track = DSATrack(
            user_id=current_user.id,
            problem_id=problem_id,
            platform=platform,
            status=status,
            completed_at=datetime.now(timezone.utc) if status == "done" else None,
        )
        db.add(track)

    if status == "done" and not previously_done:
        log_user_activity(
            db,
            current_user.id,
            "dsa",
            note=f"Completed problem {problem_id} on {platform}",
        )

    db.commit()
    return {
        "success": True,
        "problem_id": problem_id,
        "status": status,
        "completed_at": track.completed_at.isoformat() if track.completed_at else None,
    }
