"""
Message Bus — Inter-agent communication for the SmartResume agent team.

Provides in-memory message passing so agents can delegate tasks,
share context, and coordinate workflows.
"""

import asyncio
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

logger = logging.getLogger(__name__)


class MessageType(str, Enum):
    REQUEST = "request"       # "Please do X"
    RESPONSE = "response"     # "Here's the result of X"
    HANDOFF = "handoff"       # "Routing this to agent Y"
    INFO = "info"             # "FYI, context update"


@dataclass
class AgentMessage:
    """A single message between agents."""
    from_agent: str
    to_agent: str
    message_type: MessageType
    content: dict
    context: dict = field(default_factory=dict)
    message_id: str = field(default_factory=lambda: uuid.uuid4().hex[:10])
    timestamp: float = field(default_factory=time.time)
    # For request-response pairing
    reply_to: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "from_agent": self.from_agent,
            "to_agent": self.to_agent,
            "message_type": self.message_type.value,
            "content": self.content,
            "message_id": self.message_id,
            "timestamp": self.timestamp,
            "reply_to": self.reply_to,
        }


class MessageBus:
    """
    In-memory message bus for agent-to-agent communication.

    Usage:
        bus = MessageBus()

        # Fire-and-forget
        await bus.send(AgentMessage(...))

        # Request-response (blocks until reply or timeout)
        reply = await bus.request(AgentMessage(...), timeout=30)

        # Get full trace
        log = bus.get_conversation_log(session_id)
    """

    def __init__(self):
        # Per-session message logs for tracing
        self._logs: dict[str, list[AgentMessage]] = {}
        # Pending request futures keyed by message_id
        self._pending: dict[str, asyncio.Future] = {}

    async def send(self, message: AgentMessage, session_id: str = "default") -> None:
        """Send a message (fire-and-forget). Logged for tracing."""
        self._log(session_id, message)

        # If this is a response to a pending request, resolve the future
        if message.reply_to and message.reply_to in self._pending:
            future = self._pending.pop(message.reply_to)
            if not future.done():
                future.set_result(message)

        logger.debug(
            "MSG [%s] %s → %s (%s): %s",
            session_id[:6],
            message.from_agent,
            message.to_agent,
            message.message_type.value,
            str(message.content)[:100],
        )

    async def request(
        self,
        message: AgentMessage,
        session_id: str = "default",
        timeout: float = 30.0,
    ) -> Optional[AgentMessage]:
        """
        Send a request and wait for a response (matched by reply_to).
        Returns the reply AgentMessage, or None on timeout.
        """
        loop = asyncio.get_running_loop()
        future = loop.create_future()
        self._pending[message.message_id] = future

        await self.send(message, session_id)

        try:
            reply = await asyncio.wait_for(future, timeout=timeout)
            return reply
        except asyncio.TimeoutError:
            self._pending.pop(message.message_id, None)
            logger.warning(
                "Request %s from %s to %s timed out after %.0fs",
                message.message_id,
                message.from_agent,
                message.to_agent,
                timeout,
            )
            return None

    def get_conversation_log(self, session_id: str = "default") -> list[dict]:
        """Get the full message trace for a session."""
        return [m.to_dict() for m in self._logs.get(session_id, [])]

    def clear_session(self, session_id: str) -> None:
        """Remove logs for a session."""
        self._logs.pop(session_id, None)

    def _log(self, session_id: str, message: AgentMessage) -> None:
        if session_id not in self._logs:
            self._logs[session_id] = []
        self._logs[session_id].append(message)
        # Cap per-session log at 200 messages
        if len(self._logs[session_id]) > 200:
            self._logs[session_id] = self._logs[session_id][-150:]
