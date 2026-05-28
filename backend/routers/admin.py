from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import User, LLMCallLog, get_db
from auth import get_current_user
from config import settings

router = APIRouter(tags=["Admin Panel"])


@router.get("/admin/llm-metrics")
async def get_llm_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lightweight telemetry endpoint for model reliability and latency.
    Requires authentication and administrator role.
    """
    if not settings.is_admin_email(current_user.email):
        raise HTTPException(status_code=403, detail="Admin access required")

    rows = db.query(LLMCallLog).order_by(LLMCallLog.created_at.desc()).limit(500).all()
    total = len(rows)
    if total == 0:
        return {
            "total_calls": 0,
            "success_rate_pct": 0.0,
            "avg_latency_ms": 0.0,
            "by_task": {},
            "by_provider": {},
        }

    success_count = sum(1 for row in rows if row.success)
    avg_latency = round(sum(row.latency_ms for row in rows) / total, 2)

    by_task: dict = {}
    by_provider: dict = {}
    for row in rows:
        task_bucket = by_task.setdefault(
            row.task,
            {"calls": 0, "success": 0, "avg_latency_ms": 0.0},
        )
        task_bucket["calls"] += 1
        task_bucket["success"] += 1 if row.success else 0
        task_bucket["avg_latency_ms"] += row.latency_ms

        provider_bucket = by_provider.setdefault(
            row.provider,
            {"calls": 0, "success": 0, "avg_latency_ms": 0.0},
        )
        provider_bucket["calls"] += 1
        provider_bucket["success"] += 1 if row.success else 0
        provider_bucket["avg_latency_ms"] += row.latency_ms

    for bucket in by_task.values():
        bucket["success_rate_pct"] = round((bucket["success"] / max(bucket["calls"], 1)) * 100, 2)
        bucket["avg_latency_ms"] = round(bucket["avg_latency_ms"] / max(bucket["calls"], 1), 2)
        del bucket["success"]

    for bucket in by_provider.values():
        bucket["success_rate_pct"] = round((bucket["success"] / max(bucket["calls"], 1)) * 100, 2)
        bucket["avg_latency_ms"] = round(bucket["avg_latency_ms"] / max(bucket["calls"], 1), 2)
        del bucket["success"]

    return {
        "total_calls": total,
        "success_rate_pct": round((success_count / total) * 100, 2),
        "avg_latency_ms": avg_latency,
        "by_task": by_task,
        "by_provider": by_provider,
    }
