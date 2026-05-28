from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import User, MentorConversation, get_db
from auth import get_current_user
from utils.limiter import limiter

router = APIRouter(tags=["AI Mentor"])


@router.post("/mentor/chat")
@limiter.limit("30/minute")
async def mentor_chat(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = await request.json()
    user_message = (data.get("message") or "").strip()
    is_init = data.get("is_init", False)
    if not user_message and not is_init:
        raise HTTPException(status_code=400, detail="message required")
    if is_init:
        user_message = "__init__"

    history_rows = (
        db.query(MentorConversation)
        .filter(MentorConversation.user_id == current_user.id)
        .order_by(MentorConversation.created_at.desc())
        .limit(20)
        .all()
    )
    history = [{"role": r.role, "content": r.content} for r in reversed(history_rows)]

    from services.agent_service import run_agent

    response_text, tools_used = run_agent(
        user_message=user_message,
        user=current_user,
        db=db,
        conversation_history=history,
        is_init=is_init,
    )

    if not is_init:
        db.add(MentorConversation(user_id=current_user.id, role="user", content=user_message, tools_used=[]))
    db.add(MentorConversation(user_id=current_user.id, role="assistant", content=response_text, tools_used=tools_used))
    db.commit()
    return {"response": response_text, "tools_used": tools_used}


@router.get("/mentor/history")
async def mentor_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(MentorConversation)
        .filter(MentorConversation.user_id == current_user.id)
        .order_by(MentorConversation.created_at.asc())
        .limit(40)
        .all()
    )
    return {
        "messages": [
            {
                "id": r.id,
                "role": r.role,
                "content": r.content,
                "tools_used": r.tools_used or [],
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]
    }


@router.delete("/mentor/history")
async def mentor_clear(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(MentorConversation).filter(MentorConversation.user_id == current_user.id).delete()
    db.commit()
    return {"success": True}
