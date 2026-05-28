from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from database import DailyLog

def log_user_activity(
    db: Session,
    user_id: int,
    category: str,
    count: int = 1,
    note: str = "",
    when: Optional[datetime] = None,
) -> None:
    if not category or count <= 0:
        return

    log_date = (when or datetime.now(timezone.utc)).date()
    existing = (
        db.query(DailyLog)
        .filter(
            DailyLog.user_id == user_id,
            DailyLog.category == category,
            DailyLog.log_date == log_date,
        )
        .first()
    )

    if existing:
        existing.count = (existing.count or 0) + count
        if note:
            existing.note = note[:500]
    else:
        db.add(
            DailyLog(
                user_id=user_id,
                category=category,
                count=count,
                note=note[:500] if note else "",
                log_date=log_date,
            )
        )
