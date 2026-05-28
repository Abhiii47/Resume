import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from starlette.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import (
    User,
    Analysis,
    AgentConversation,
    AgentTrace,
    SessionLocal,
    get_db,
)
from auth import get_current_user
from utils.limiter import limiter
from utils.resume_utils import get_analysis_resume_text

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Multi-Agent System"])

AGENT_INFO = {
    "nova": {
        "name": "Nova",
        "role": "Orchestrator",
        "emoji": "🧠",
        "color": "#f97316",
        "description": "Routes requests and coordinates the team",
    },
    "maya": {
        "name": "Maya",
        "role": "Resume Analyst",
        "emoji": "🔍",
        "color": "#3b82f6",
        "description": "ATS scoring, keyword analysis, flaw detection",
    },
    "max": {
        "name": "Max",
        "role": "Content Writer",
        "emoji": "✍️",
        "color": "#8b5cf6",
        "description": "Rewrites bullets, cover letters, outreach copy",
    },
    "scout": {
        "name": "Scout",
        "role": "Job Scout",
        "emoji": "🎯",
        "color": "#22c55e",
        "description": "Finds matching jobs, tracks applications",
    },
    "alex": {
        "name": "Alex",
        "role": "Career Coach",
        "emoji": "🧭",
        "color": "#f59e0b",
        "description": "Roadmaps, interview prep, career strategy",
    },
}


@router.get("/agents/team")
async def get_agent_team(current_user: User = Depends(get_current_user)):
    """Return info for all 5 agents."""
    try:
        from agents import get_team

        team = get_team()
        return {"agents": team.all_agents_info()}
    except Exception:
        # Fallback static info if team not initialized
        return {"agents": list(AGENT_INFO.values())}


@router.post("/agents/chat")
@limiter.limit("20/minute")
async def agents_chat_sse(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Stream a multi-agent conversation via Server-Sent Events.
    The orchestrator (Nova) classifies intent and delegates to specialists.
    """
    from agents import get_team
    from agents.base_agent import AgentContext

    data = await request.json()
    user_message = (data.get("message") or "").strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="message required")

    # Build resume context from latest analysis
    resume_text = ""
    latest = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).first()
    if latest:
        resume_text = get_analysis_resume_text(latest)

    job_description = (data.get("job_description") or "").strip()

    # Build user state from various sources
    user_state = {}
    try:
        from services.agent_service import build_user_context

        user_state = build_user_context(current_user, db)
    except Exception:
        pass

    # Load conversation history
    history_rows = (
        db.query(AgentConversation)
        .filter(AgentConversation.user_id == current_user.id)
        .order_by(AgentConversation.created_at.desc())
        .limit(20)
        .all()
    )
    conversation_history = [
        {"role": "user" if r.role == "user" else "assistant", "content": r.content} for r in reversed(history_rows)
    ]

    session_id = uuid.uuid4().hex

    context = AgentContext(
        user_id=current_user.id,
        user_message=user_message,
        conversation_history=conversation_history,
        resume_text=resume_text,
        job_description=job_description,
        user_state=user_state,
        session_id=session_id,
        db=db,
        user=current_user,
    )

    # Save user message
    db.add(
        AgentConversation(
            user_id=current_user.id,
            session_id=session_id,
            agent_name="user",
            role="user",
            content=user_message,
            message_type="message",
        )
    )
    db.commit()

    user_id = current_user.id  # eagerly capture before session closes

    async def event_stream():
        stream_db = SessionLocal()
        team = get_team()
        nova = team.nova
        agents_used = []
        final_content = ""

        try:
            async for sse_event in nova.run(context):
                yield sse_event.format()

                if sse_event.event == "agent_message":
                    agent_name = sse_event.data.get("agent", "unknown")
                    content = sse_event.data.get("content", "")
                    final_content = content
                    if agent_name not in agents_used:
                        agents_used.append(agent_name)

                    stream_db.add(
                        AgentConversation(
                            user_id=user_id,
                            session_id=session_id,
                            agent_name=agent_name,
                            role="agent",
                            content=content,
                            message_type="message",
                            metadata_json={
                                "color": sse_event.data.get("color"),
                                "emoji": sse_event.data.get("emoji"),
                                "tools_used": sse_event.data.get("tools_used", []),
                            },
                        )
                    )
                    stream_db.commit()

                elif sse_event.event == "done":
                    agents_used = sse_event.data.get("agents_used", agents_used)

        except Exception as e:
            logger.error(f"Agent streaming error: {e}")
            import json as _json

            yield f"event: error\ndata: {_json.dumps({'error': str(e)})}\n\n"
            yield f"event: done\ndata: {_json.dumps({'agents_used': agents_used})}\n\n"

        try:
            stream_db.add(
                AgentTrace(
                    user_id=user_id,
                    session_id=session_id,
                    trace_id=context.request_id,
                    user_message=user_message,
                    agents_used=agents_used,
                )
            )
            stream_db.commit()
        except Exception as e:
            logger.error(f"AgentTrace DB error: {e}")
            import json as _json
            yield f"event: error\ndata: {_json.dumps({'error': f'Failed to save trace: {e}'})}\n\n"
        finally:
            stream_db.close()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/agents/history")
async def get_agent_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Load multi-agent conversation history."""
    rows = (
        db.query(AgentConversation)
        .filter(AgentConversation.user_id == current_user.id)
        .order_by(AgentConversation.created_at.asc())
        .limit(60)
        .all()
    )
    messages = []
    for r in rows:
        meta = r.metadata_json or {}
        if r.role == "user":
            messages.append(
                {
                    "id": r.id,
                    "event_type": "user",
                    "agent": "you",
                    "content": r.content,
                    "timestamp": r.created_at.isoformat() if r.created_at else None,
                }
            )
        else:
            messages.append(
                {
                    "id": r.id,
                    "event_type": "agent_message",
                    "agent": r.agent_name,
                    "emoji": meta.get("emoji", "🤖"),
                    "color": meta.get("color", "#f97316"),
                    "content": r.content,
                    "tools_used": meta.get("tools_used", []),
                    "timestamp": r.created_at.isoformat() if r.created_at else None,
                }
            )
    return {"messages": messages}


@router.delete("/agents/history")
async def clear_agent_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear multi-agent conversation history."""
    db.query(AgentConversation).filter(AgentConversation.user_id == current_user.id).delete()
    db.query(AgentTrace).filter(AgentTrace.user_id == current_user.id).delete()
    db.commit()
    return {"success": True}
