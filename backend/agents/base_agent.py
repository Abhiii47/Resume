"""Base agent with ReAct loop, SSE streaming, and typed tool system."""

import asyncio
import json
import re
import time
import uuid
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, AsyncGenerator, Callable, Optional

logger = logging.getLogger(__name__)


class AgentStatus(str, Enum):
    STANDBY = "standby"
    THINKING = "thinking"
    ACTIVE = "active"
    TOOL_EXECUTING = "tool_executing"
    ERROR = "error"


@dataclass
class AgentTool:
    """A tool/capability available to an agent."""
    name: str
    description: str
    parameters: dict
    handler: Callable

    def schema(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
        }


@dataclass
class ToolCall:
    """A request to execute a tool."""
    tool_name: str
    arguments: dict
    call_id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])


@dataclass
class ToolResult:
    """Result from a tool execution."""
    call_id: str
    tool_name: str
    success: bool
    result: Any = None
    error: str = None


@dataclass
class AgentContext:
    """All context passed to an agent for a single request."""
    user_id: int
    user_message: str
    conversation_history: list = field(default_factory=list)
    resume_text: Optional[str] = None
    job_description: Optional[str] = None
    user_state: dict = field(default_factory=dict)
    shared_context: dict = field(default_factory=dict)
    session_id: str = field(default_factory=lambda: uuid.uuid4().hex)
    request_id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    db: Any = None
    user: Any = None


@dataclass
class SSEEvent:
    """A Server-Sent Event for streaming agent responses to the UI."""
    event: str
    data: dict

    def format(self) -> str:
        return f"event: {self.event}\ndata: {json.dumps(self.data, default=str)}\n\n"


class BaseAgent(ABC):
    """Abstract base for agent logic."""

    def __init__(self):
        self.name: str = "Agent"
        self.role: str = "Base Agent"
        self.emoji: str = "🤖"
        self.color: str = "#6b7280"
        self.description: str = ""
        self.personality: str = ""
        self.tools: list[AgentTool] = []
        self.status: AgentStatus = AgentStatus.STANDBY
        self.max_iterations: int = 5

        self._llm = None
        self._db_factory = None
        self._bus = None

    def configure(self, llm_service, db_session_factory, message_bus=None):
        self._llm = llm_service
        self._db_factory = db_session_factory
        self._bus = message_bus

    def get_info(self) -> dict:
        return {
            "name": self.name,
            "role": self.role,
            "emoji": self.emoji,
            "color": self.color,
            "description": self.description,
            "status": self.status.value,
            "tools": [t.schema() for t in self.tools],
        }

    def get_tool(self, name: str) -> Optional[AgentTool]:
        for t in self.tools:
            if t.name == name:
                return t
        return None

    @property
    def system_prompt(self) -> str:
        tools_block = "\n".join(
            f"  - {t.name}: {t.description}  Parameters: {json.dumps(t.parameters)}"
            for t in self.tools
        )
        return f"""You are {self.name}, the {self.role} in the SmartResume career placement team.

{self.emoji} **Role**: {self.description}

**Personality**: {self.personality}

**Your Tools**:
{tools_block}

**Response Rules**:
1. When you need data or need to perform an action, respond with ONLY a JSON block — no text before or after:
   {{"tool_call": {{"name": "<tool_name>", "arguments": {{...}}}}}}
2. When you have enough information, write your final answer as plain text (NO JSON at all).
3. CRITICAL: NEVER mix a tool_call JSON with plain text in the same response. ONE OR THE OTHER.
4. Call tools ONE AT A TIME. Do not output multiple tool_call blocks in a single response.
5. Be concise, specific, and action-oriented.
6. Reference real numbers and data — never be vague.
7. If a task is outside your expertise, clearly state which team member should handle it.
8. Max 300 words for final answers unless generating a document."""

    async def _call_llm(self, messages: list[dict], task: str = "general") -> str:
        if not self._llm:
            raise RuntimeError(f"Agent {self.name} not configured with LLM service")

        system_msg = next(
            (m["content"] for m in messages if m["role"] == "system"), ""
        )
        conversation = [m for m in messages if m["role"] != "system"]

        parts = []
        for msg in conversation:
            label = "User" if msg["role"] == "user" else "Assistant"
            parts.append(f"{label}: {msg['content']}")
        prompt = "\n\n".join(parts)

        result = await asyncio.to_thread(
            self._llm._call_llm, prompt, system_msg, task
        )
        return result or ""

    async def _call_llm_json(
        self, messages: list[dict], task: str = "structured_extract"
    ) -> dict:
        raw = await self._call_llm(messages, task)
        return self._extract_json(raw)

    @staticmethod
    def _extract_json(text: str) -> dict:
        """Parse a JSON object from text, even when mixed with prose."""
        # 1. Try the whole text first (clean JSON response)
        try:
            return json.loads(text)
        except (json.JSONDecodeError, TypeError):
            pass

        # 2. Fenced code block
        m = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(1))
            except json.JSONDecodeError:
                pass

        # 3. Scan for ALL JSON objects using a bracket-balanced scanner
        #    This correctly handles multiple JSON blocks in the same response.
        i = 0
        candidates = []
        while i < len(text):
            if text[i] == '{':
                depth = 0
                start = i
                for j in range(i, len(text)):
                    if text[j] == '{':
                        depth += 1
                    elif text[j] == '}':
                        depth -= 1
                        if depth == 0:
                            candidates.append(text[start:j + 1])
                            i = j + 1
                            break
                else:
                    break
            else:
                i += 1

        # Return the first candidate that parses as valid JSON
        # Prefer ones that contain 'tool_call' (most important case)
        for candidate in candidates:
            try:
                obj = json.loads(candidate)
                if isinstance(obj, dict):
                    if "tool_call" in obj:  # Prioritise tool_call blocks
                        return obj
            except json.JSONDecodeError:
                pass
        for candidate in candidates:
            try:
                obj = json.loads(candidate)
                if isinstance(obj, dict):
                    return obj
            except json.JSONDecodeError:
                pass

        return {"raw_response": text}

    @staticmethod
    def _clean_content(text: str) -> str:
        """Strip embedded tool_call JSON blobs from prose before displaying."""
        # Remove fenced JSON blocks
        text = re.sub(r"```(?:json)?\s*\n?\{[\s\S]*?\}\s*\n?```", "", text)
        # Remove bare tool_call JSON objects
        text = re.sub(r'\{\s*"tool_call"\s*:[\s\S]*?\}\s*', "", text)
        # Remove any remaining standalone JSON object blocks
        text = re.sub(r'\n\{[\s\S]{0,2000}?\}\n', "\n", text)
        return text.strip()

    def _parse_tool_call(self, response: str) -> Optional[ToolCall]:
        data = self._extract_json(response)
        tc = data.get("tool_call")
        if isinstance(tc, dict) and "name" in tc:
            return ToolCall(
                tool_name=tc["name"],
                arguments=tc.get("arguments", {}),
            )
        return None

    async def _execute_tool(
        self, tool: AgentTool, arguments: dict, context: AgentContext
    ) -> Any:
        kwargs = {**arguments, "context": context}
        if asyncio.iscoroutinefunction(tool.handler):
            return await tool.handler(**kwargs)
        return await asyncio.to_thread(tool.handler, **kwargs)

    async def run(self, context: AgentContext) -> AsyncGenerator[SSEEvent, None]:
        self.status = AgentStatus.THINKING

        messages = [{"role": "system", "content": self.system_prompt}]

        for msg in context.conversation_history[-10:]:
            messages.append(
                {"role": msg.get("role", "user"), "content": msg.get("content", "")}
            )

        user_parts = [context.user_message]
        if context.resume_text:
            user_parts.append(
                f"\n\n[RESUME TEXT (excerpt)]:\n{context.resume_text[:3000]}"
            )
        if context.job_description:
            user_parts.append(
                f"\n\n[JOB DESCRIPTION]:\n{context.job_description[:1500]}"
            )
        if context.shared_context:
            user_parts.append(
                f"\n\n[CONTEXT FROM OTHER AGENTS]:\n"
                f"{json.dumps(context.shared_context, indent=2, default=str)[:2000]}"
            )
        if context.user_state:
            user_parts.append(
                f"\n\n[YOUR CAREER DATA]:\n"
                f"{json.dumps(context.user_state, indent=2, default=str)[:1000]}"
            )
        messages.append({"role": "user", "content": "\n".join(user_parts)})

        tool_log: list[ToolResult] = []

        for iteration in range(self.max_iterations):
            self.status = AgentStatus.THINKING
            yield SSEEvent(
                event="agent_thinking",
                data={
                    "agent": self.name,
                    "emoji": self.emoji,
                    "iteration": iteration + 1,
                },
            )

            try:
                response = await self._call_llm(messages, task="general")
            except Exception as exc:
                self.status = AgentStatus.ERROR
                yield SSEEvent(
                    event="error",
                    data={"agent": self.name, "error": str(exc)},
                )
                yield SSEEvent(
                    event="agent_message",
                    data={
                        "agent": self.name,
                        "emoji": self.emoji,
                        "color": self.color,
                        "content": (
                            f"I hit a snag: {exc}. "
                            "Let me try a different approach or ask a teammate."
                        ),
                    },
                )
                break

            tool_call = self._parse_tool_call(response)

            if tool_call and tool_call.tool_name:
                tool = self.get_tool(tool_call.tool_name)
                if not tool:
                    messages.append({"role": "assistant", "content": response})
                    messages.append(
                        {
                            "role": "user",
                            "content": (
                                f"Error: Tool '{tool_call.tool_name}' not found. "
                                f"Available: {[t.name for t in self.tools]}. "
                                "Try again or give your final answer."
                            ),
                        }
                    )
                    continue

                self.status = AgentStatus.TOOL_EXECUTING
                yield SSEEvent(
                    event="tool_call",
                    data={
                        "agent": self.name,
                        "emoji": self.emoji,
                        "tool": tool_call.tool_name,
                        "arguments": tool_call.arguments,
                        "call_id": tool_call.call_id,
                        "status": "running",
                    },
                )

                try:
                    result = await self._execute_tool(
                        tool, tool_call.arguments, context
                    )
                    tr = ToolResult(
                        call_id=tool_call.call_id,
                        tool_name=tool_call.tool_name,
                        success=True,
                        result=result,
                    )
                except Exception as exc:
                    tr = ToolResult(
                        call_id=tool_call.call_id,
                        tool_name=tool_call.tool_name,
                        success=False,
                        error=str(exc),
                    )

                tool_log.append(tr)

                yield SSEEvent(
                    event="tool_result",
                    data={
                        "agent": self.name,
                        "emoji": self.emoji,
                        "tool": tool_call.tool_name,
                        "call_id": tool_call.call_id,
                        "success": tr.success,
                        "result": _safe_serialize(tr.result) if tr.success else None,
                        "error": tr.error,
                    },
                )

                messages.append({"role": "assistant", "content": response})
                result_str = (
                    json.dumps(_safe_serialize(tr.result), indent=2, default=str)
                    if tr.success
                    else f"Error: {tr.error}"
                )
                messages.append(
                    {
                        "role": "user",
                        "content": (
                            f"Tool '{tool_call.tool_name}' result:\n"
                            f"{result_str[:3000]}\n\n"
                            "Analyze this and either call another tool or "
                            "give your final response."
                        ),
                    }
                )

            else:
                self.status = AgentStatus.ACTIVE
                # Clean any embedded raw JSON / tool_call artifacts from the
                # final message before it reaches the user
                clean = self._clean_content(response)
                if not clean:
                    # The response was ONLY JSON (tool_call without args)
                    # — push it back to the LLM for a proper final answer
                    messages.append({"role": "assistant", "content": response})
                    messages.append({
                        "role": "user",
                        "content": (
                            "Your previous response contained only JSON. "
                            "Please write your final answer as plain text — "
                            "no JSON, just a helpful, clear summary for the user."
                        ),
                    })
                    continue
                yield SSEEvent(
                    event="agent_message",
                    data={
                        "agent": self.name,
                        "emoji": self.emoji,
                        "color": self.color,
                        "role": self.role,
                        "content": clean,
                        "tools_used": [t.tool_name for t in tool_log],
                    },
                )
                break

        self.status = AgentStatus.STANDBY

    async def handle_direct_message(
        self, context: AgentContext
    ) -> AsyncGenerator[SSEEvent, None]:
        async for event in self.run(context):
            yield event


def _safe_serialize(obj: Any) -> Any:
    """Recursively make an object JSON-safe."""
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, dict):
        return {k: _safe_serialize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_safe_serialize(v) for v in obj]
    return str(obj)
