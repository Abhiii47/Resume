from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import User, DailyLog, get_db
from auth import get_current_user

router = APIRouter(tags=["Daily Tracker"])


@router.post("/tracker/log")
async def log_daily_activity(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = await request.json()
    category = data.get("category", "")
    count = int(data.get("count", 1))
    note = data.get("note", "")
    if not category:
        raise HTTPException(status_code=400, detail="category required")
    today = datetime.now(timezone.utc).date()
    existing = (
        db.query(DailyLog)
        .filter(DailyLog.user_id == current_user.id, DailyLog.category == category, DailyLog.log_date == today)
        .first()
    )
    if existing:
        existing.count = existing.count + count
        existing.note = note or existing.note
    else:
        db.add(DailyLog(user_id=current_user.id, category=category, count=count, note=note, log_date=today))
    db.commit()
    return {"success": True, "category": category, "date": today.isoformat()}


@router.get("/tracker/weekly")
async def get_weekly_tracker(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc).date() - timedelta(days=30)
    logs = db.query(DailyLog).filter(DailyLog.user_id == current_user.id, DailyLog.log_date >= cutoff).all()
    calendar = {}
    by_category = {}
    for log in logs:
        day = log.log_date.isoformat()
        if day not in calendar:
            calendar[day] = {}
        calendar[day][log.category] = calendar[day].get(log.category, 0) + log.count
        by_category[log.category] = by_category.get(log.category, 0) + log.count
    today = datetime.now(timezone.utc).date()
    CATS = ["resume", "planning", "dsa", "system_design", "cs_fundamentals", "behavioral", "projects", "applications"]
    streaks = {}
    for cat in CATS:
        streak, cursor = 0, today
        while calendar.get(cursor.isoformat(), {}).get(cat, 0) > 0:
            streak += 1
            cursor -= timedelta(days=1)
        streaks[cat] = streak
    return {"calendar": calendar, "by_category": by_category, "streaks": streaks, "today": today.isoformat()}
