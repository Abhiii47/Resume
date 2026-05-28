"""Nova — Orchestrator agent that routes requests and coordinates the team."""

import asyncio
import json
import logging
import time
from typing import AsyncGenerator, Optional

from .base_agent import AgentContext, AgentStatus, AgentTool, BaseAgent, SSEEvent

logger = logging.getLogger(__name__)


WORKFLOW_TEMPLATES = {
    "full_review": {
        "description": "Complete resume review with improvements",
        "parallel": True,   # Maya, Max, Alex are fully independent — run simultaneously
        "steps": [
            {"agent": "maya", "task": "Score and analyze the resume for flaws"},
            {"agent": "max",  "task": "Rewrite the top 3 weakest bullet points"},
            {"agent": "alex", "task": "Provide strategic career advice based on the resume"},
        ],
    },
    "job_hunt": {
        "description": "Find matching jobs and prepare applications",
        "parallel": False,  # Scout → Maya → Max: later agents need prior results
        "steps": [
            {"agent": "scout", "task": "Search for matching jobs based on the user's skills"},
            {"agent": "maya",  "task": "Analyze resume fit for the top matching job"},
            {"agent": "max",   "task": "Generate a tailored cover letter for the best match"},
        ],
    },
    "interview_prep": {
        "description": "Prepare for interviews",
        "parallel": True,   # Maya (gap analysis) + Alex (questions) are independent
        "steps": [
            {"agent": "maya", "task": "Identify skill gaps and weak areas in the resume"},
            {"agent": "alex", "task": "Generate interview questions and preparation tips"},
        ],
    },
    "quick_fix": {
        "description": "Quick resume improvements",
        "parallel": False,  # Max needs Maya's findings — keep sequential
        "steps": [
            {"agent": "maya", "task": "Identify the top 3 most critical resume flaws"},
            {"agent": "max",  "task": "Rewrite and fix the identified flaws"},
        ],
    },
    "end_to_end_journey": {
        "description": "Complete career journey: analyze resume, find jobs, find gaps, and generate learning roadmap",
        "parallel": False,  # Each step depends on prior agent output
        "steps": [
            {"agent": "maya",  "task": "Analyze the resume to extract current skills and identify areas of improvement"},
            {
                "agent": "scout",
                "task": "Search for top matching jobs based on the user's skills and compare the resume against the best job",
            },
            {
                "agent": "alex",
                "task": "Generate a personalized learning roadmap to bridge the skill gap between the resume and the target job found",
            },
        ],
    },
}


class OrchestratorAgent(BaseAgent):
    """
    Nova — the orchestrator that routes requests and coordinates agents.
    Unlike other agents, Nova doesn't have domain tools.
    Instead, she classifies intent and delegates to specialists.
    Supports both parallel (simultaneous) and sequential (chained) execution.
    """

    def __init__(self):
        super().__init__()
        self.name = "Nova"
        self.role = "Orchestrator"
        self.emoji = "🧠"
        self.color = "#f97316"
        self.description = (
            "I coordinate the agent team. I figure out what you need "
            "and route your request to the right specialist(s). "
            "You DO NOT perform the tasks yourself. Your ONLY job is to delegate tasks appropriately based on the specialist's expertise."
        )
        self.personality = (
            "Sharp, efficient, and always in control. You see the big picture "
            "and know exactly which team member to call. You're warm but concise — "
            "a great project manager who keeps things moving."
        )

        # Nova doesn't have domain tools — she delegates
        self.tools = []
        self._team = {}
        self._bus = None

    def set_team(self, agents: dict, bus):
        """Give Nova access to the full agent team."""
        self._team = agents
        self._bus = bus

    async def _classify_intent(self, message: str, context: AgentContext) -> dict:
        """
        Use LLM to classify user intent and pick the right agent(s).
        Falls back to keyword matching if LLM fails.
        """
        agent_descriptions = "\n".join(
            f"  - {name}: {a.name} the {a.role} — {a.description}" for name, a in self._team.items() if name != "nova"
        )

        prompt = f"""You are Nova, an AI orchestrator. Classify this user message and decide which agent(s) should handle it.

AVAILABLE AGENTS:
{agent_descriptions}

PREDEFINED WORKFLOWS (use if the message clearly matches):
  - "full_review": Complete resume analysis + improvements + career advice
  - "job_hunt": Search for jobs + match resume + generate cover letter
  - "interview_prep": Identify gaps + generate interview questions
  - "quick_fix": Find top flaws + rewrite them
  - "end_to_end_journey": Complete career journey: analyze resume, find jobs, find gaps, and generate learning roadmap

USER MESSAGE: "{message}"

USER HAS RESUME: {"Yes" if context.resume_text else "No"}
USER HAS JOB DESCRIPTION: {"Yes" if context.job_description else "No"}

Return JSON:
{{
  "intent": "brief description of what the user wants",
  "workflow": "full_review|job_hunt|interview_prep|quick_fix|end_to_end_journey|null",
  "agents": ["agent_key1", "agent_key2"],
  "tasks": {{"agent_key": "specific task to give this agent"}},
  "direct_response": "If this is a simple greeting or question Nova can answer directly without delegating, put the response here. Otherwise null."
}}

Rules:
- If the user says hi/hello or asks a general question, set direct_response
- If no resume is uploaded and they want analysis, set direct_response asking them to upload first
- For complex requests, pick 1-3 agents maximum
- Always pick the most relevant agent(s), don't over-delegate"""

        try:
            result = await self._call_llm_json(
                [
                    {"role": "system", "content": "You are an intent classifier. Respond ONLY in valid JSON."},
                    {"role": "user", "content": prompt},
                ],
                task="agent_routing",
            )
            if "agents" in result or "direct_response" in result:
                return result
        except Exception as e:
            logger.warning("Intent classification failed: %s", e)

        # Fallback: keyword classification
        return self._keyword_classify(message, context)

    def _keyword_classify(self, message: str, context: AgentContext) -> dict:
        """Fast keyword-based fallback for intent classification."""
        ml = message.lower()
        agents = []
        tasks = {}

        # Check for workflow triggers
        if any(
            k in ml for k in ["end to end", "full journey", "overall", "find job and learn", "find job and roadmap"]
        ):
            return {
                "intent": "end to end journey",
                "workflow": "end_to_end_journey",
                "agents": [],
                "tasks": {},
                "direct_response": None,
            }
        if any(k in ml for k in ["full review", "review my resume", "check everything", "analyze everything"]):
            return {
                "intent": "full review",
                "workflow": "full_review",
                "agents": [],
                "tasks": {},
                "direct_response": None,
            }
        if any(k in ml for k in ["find job", "search job", "job hunt", "looking for", "open positions"]):
            return {"intent": "job search", "workflow": "job_hunt", "agents": [], "tasks": {}, "direct_response": None}
        if any(k in ml for k in ["interview", "prepare for interview", "mock interview"]):
            return {
                "intent": "interview prep",
                "workflow": "interview_prep",
                "agents": [],
                "tasks": {},
                "direct_response": None,
            }
        if any(k in ml for k in ["quick fix", "fix my resume", "improve quick"]):
            return {"intent": "quick fix", "workflow": "quick_fix", "agents": [], "tasks": {}, "direct_response": None}

        # Individual agent matching
        resume_kw = ["resume", "cv", "score", "ats", "analyze", "flaw", "gap", "keyword", "format", "section"]
        if any(k in ml for k in resume_kw):
            agents.append("maya")
            tasks["maya"] = message

        write_kw = ["rewrite", "bullet", "cover letter", "pitch", "linkedin", "cold email", "improve writing"]
        if any(k in ml for k in write_kw):
            agents.append("max")
            tasks["max"] = message

        job_kw = ["job", "apply", "application", "company", "position", "salary", "remote"]
        if any(k in ml for k in job_kw):
            agents.append("scout")
            tasks["scout"] = message

        coach_kw = ["roadmap", "plan", "strategy", "career", "skill", "growth", "advice", "mentor", "study", "prepare"]
        if any(k in ml for k in coach_kw):
            agents.append("alex")
            tasks["alex"] = message

        # Greetings → direct response
        greet_kw = ["hi", "hello", "hey", "what can you do", "help", "who are you"]
        if not agents and any(k in ml for k in greet_kw):
            return {
                "intent": "greeting",
                "workflow": None,
                "agents": [],
                "tasks": {},
                "direct_response": (
                    "Hey! 👋 I'm **Nova**, your career placement coordinator. "
                    "I lead a team of 5 AI agents:\n\n"
                    "🔍 **Maya** — Resume Analyst (scores, finds flaws)\n"
                    "✍️ **Max** — Content Writer (rewrites, cover letters)\n"
                    "🎯 **Scout** — Job Scout (finds matching jobs)\n"
                    "🧭 **Alex** — Career Coach (roadmaps, interview prep)\n\n"
                    "**Try these:**\n"
                    '- "Review my resume" — full team analysis\n'
                    '- "Find React developer jobs" — job search\n'
                    '- "Prepare me for interviews" — interview prep\n\n'
                    "Upload your resume and a job description for the best results!"
                ),
            }

        # Default: send to Alex (career coach) as the general advisor
        if not agents:
            agents.append("alex")
            tasks["alex"] = message

        return {
            "intent": "user request",
            "workflow": None,
            "agents": agents[:3],
            "tasks": tasks,
            "direct_response": None,
        }

    # ── Parallel fan-in helpers ────────────────────────────────────────────────

    async def _agent_to_queue(
        self,
        agent,
        agent_context: AgentContext,
        queue: asyncio.Queue,
        sentinel: str,
    ) -> dict:
        """
        Run one agent, pushing every SSEEvent into queue.
        Returns the agent's final response dict for accumulated_context.
        """
        agent_response = ""
        agent_tools_used: list[str] = []
        try:
            async for event in agent.run(agent_context):
                await queue.put(("event", event))
                if event.event == "agent_message":
                    agent_response = event.data.get("content", "")
                    agent_tools_used = event.data.get("tools_used", [])
        except Exception as exc:
            logger.error("Agent %s raised in parallel run: %s", agent.name, exc)
            await queue.put((
                "event",
                SSEEvent(event="error", data={"agent": agent.name, "error": str(exc)}),
            ))
        finally:
            await queue.put(("sentinel", sentinel))

        return {
            "agent": agent.name,
            "response": agent_response[:900],
            "tools_used": agent_tools_used,
        }

    async def _drain_parallel(
        self,
        coros,  # list of coroutines that push to queue
        queue: asyncio.Queue,
        total: int,
    ) -> AsyncGenerator[SSEEvent, None]:
        """
        Start all coroutines simultaneously and yield SSEEvents in arrival order.
        Returns collected agent results.
        """
        tasks = [asyncio.create_task(c) for c in coros]
        pending = total

        while pending > 0:
            kind, payload = await queue.get()
            if kind == "event":
                yield payload
            elif kind == "sentinel":
                pending -= 1

        # Gather results (already done, just collect return values from tasks)
        await asyncio.gather(*tasks, return_exceptions=True)

    # ── Public run ────────────────────────────────────────────────────────────

    async def run(self, context: AgentContext) -> AsyncGenerator[SSEEvent, None]:
        """
        Nova's orchestration flow:
        1. Classify intent
        2. If direct response → reply immediately
        3. If workflow → execute predefined multi-agent workflow (parallel or sequential)
        4. If specific agents → delegate (parallel when multiple)
        """
        self.status = AgentStatus.THINKING

        yield SSEEvent(
            event="agent_thinking",
            data={"agent": self.name, "emoji": self.emoji, "iteration": 1},
        )

        # Classify intent
        classification = await self._classify_intent(context.user_message, context)
        logger.info("Nova classification: %s", classification)

        # Direct response for greetings / simple questions
        direct = classification.get("direct_response")
        if direct:
            self.status = AgentStatus.ACTIVE
            yield SSEEvent(
                event="agent_message",
                data={
                    "agent": self.name,
                    "emoji": self.emoji,
                    "color": self.color,
                    "role": self.role,
                    "content": direct,
                    "tools_used": [],
                },
            )
            self.status = AgentStatus.STANDBY
            yield SSEEvent(event="done", data={"agents_used": ["nova"], "trace_id": context.request_id})
            return

        # Workflow execution
        workflow_name = classification.get("workflow")
        if workflow_name and workflow_name in WORKFLOW_TEMPLATES:
            async for event in self._run_workflow(workflow_name, context):
                yield event
            return

        # Delegate to specific agent(s)
        agent_keys = classification.get("agents", [])
        tasks = classification.get("tasks", {})

        if not agent_keys:
            agent_keys = ["alex"]
            tasks = {"alex": context.user_message}

        # Build (agent, task) pairs
        valid_pairs = []
        for agent_key in agent_keys:
            agent = self._team.get(agent_key)
            if agent:
                valid_pairs.append((agent, tasks.get(agent_key, context.user_message)))

        if not valid_pairs:
            yield SSEEvent(
                event="error",
                data={"message": f"No matching agents found for keys: {agent_keys}. Available: {list(self._team.keys())}"},
            )
            yield SSEEvent(event="done", data={"agents_used": [], "trace_id": context.request_id})
            self.status = AgentStatus.STANDBY
            return

        if len(valid_pairs) == 1:
            # Single agent — stream directly (no overhead)
            agent, task_msg = valid_pairs[0]
            yield SSEEvent(
                event="agent_handoff",
                data={
                    "from_agent": self.name,
                    "to_agent": agent.name,
                    "task": task_msg[:100],
                    "from_emoji": self.emoji,
                    "to_emoji": agent.emoji,
                    "parallel": False,
                },
            )
            agent_context = self._make_context(context, task_msg)
            async for event in agent.run(agent_context):
                yield event
            agents_used = [agent.name]
        else:
            # Multiple independent agents — run in PARALLEL
            agents_used = []
            queue: asyncio.Queue = asyncio.Queue()

            # Announce all handoffs first so UI shows them all active
            for agent, task_msg in valid_pairs:
                yield SSEEvent(
                    event="agent_handoff",
                    data={
                        "from_agent": self.name,
                        "to_agent": agent.name,
                        "task": task_msg[:100],
                        "from_emoji": self.emoji,
                        "to_emoji": agent.emoji,
                        "parallel": True,
                    },
                )

            sentinel_ids = [a.name for a, _ in valid_pairs]
            coros = [
                self._agent_to_queue(agent, self._make_context(context, task_msg), queue, agent.name)
                for agent, task_msg in valid_pairs
            ]

            tasks_futures = [asyncio.create_task(c) for c in coros]
            pending = len(tasks_futures)

            while pending > 0:
                kind, payload = await queue.get()
                if kind == "event":
                    yield payload
                elif kind == "sentinel":
                    pending -= 1

            results = await asyncio.gather(*tasks_futures, return_exceptions=True)
            for r in results:
                if isinstance(r, dict) and r.get("agent"):
                    agents_used.append(r["agent"])

        yield SSEEvent(
            event="done",
            data={"agents_used": agents_used, "trace_id": context.request_id},
        )
        self.status = AgentStatus.STANDBY

    # ── Workflow dispatcher ────────────────────────────────────────────────────

    async def _run_workflow(self, workflow_name: str, context: AgentContext) -> AsyncGenerator[SSEEvent, None]:
        """Route to parallel or sequential workflow execution based on template flag."""
        workflow = WORKFLOW_TEMPLATES[workflow_name]

        self.status = AgentStatus.ACTIVE
        is_parallel = workflow.get("parallel", False)

        yield SSEEvent(
            event="agent_message",
            data={
                "agent": self.name,
                "emoji": self.emoji,
                "color": self.color,
                "role": self.role,
                "content": (
                    f"🚀 Starting **{workflow_name.replace('_', ' ').title()}** workflow: "
                    f"{workflow['description']}. "
                    + ("Running all agents **simultaneously** ⚡" if is_parallel else "Coordinating agents step-by-step.")
                ),
                "tools_used": [],
            },
        )

        if is_parallel:
            async for event in self._run_parallel_workflow(workflow_name, context):
                yield event
        else:
            async for event in self._run_sequential_workflow(workflow_name, context):
                yield event

    async def _run_parallel_workflow(self, workflow_name: str, context: AgentContext) -> AsyncGenerator[SSEEvent, None]:
        """
        Execute a workflow where all agents run SIMULTANEOUSLY.
        Each agent receives the base context (no dependency on each other's output).
        SSE events from all agents are merged and streamed in arrival order.
        """
        workflow = WORKFLOW_TEMPLATES[workflow_name]
        steps = workflow["steps"]

        # Collect valid (agent, step) pairs
        valid_steps = []
        for step in steps:
            agent = self._team.get(step["agent"])
            if agent:
                valid_steps.append((agent, step))

        if not valid_steps:
            yield SSEEvent(event="error", data={"message": "No valid agents found for workflow"})
            return

        # Announce all handoffs simultaneously so UI shows everyone active at once
        for agent, step in valid_steps:
            yield SSEEvent(
                event="agent_handoff",
                data={
                    "from_agent": self.name,
                    "to_agent": agent.name,
                    "task": step["task"],
                    "from_emoji": self.emoji,
                    "to_emoji": agent.emoji,
                    "parallel": True,
                },
            )

        # Build contexts (all get the same base context — no accumulated prior results)
        queue: asyncio.Queue = asyncio.Queue()
        coros = [
            self._agent_to_queue(
                agent,
                self._make_context(context, step["task"], workflow=workflow_name),
                queue,
                agent.name,
            )
            for agent, step in valid_steps
        ]

        # Fire all simultaneously
        tasks_futures = [asyncio.create_task(c) for c in coros]
        pending = len(tasks_futures)

        while pending > 0:
            kind, payload = await queue.get()
            if kind == "event":
                yield payload
            elif kind == "sentinel":
                pending -= 1

        results = await asyncio.gather(*tasks_futures, return_exceptions=True)
        agents_used = ["Nova"]
        for r in results:
            if isinstance(r, dict) and r.get("agent"):
                agents_used.append(r["agent"])

        yield SSEEvent(
            event="done",
            data={
                "agents_used": agents_used,
                "trace_id": context.request_id,
                "workflow": workflow_name,
                "parallel": True,
            },
        )
        self.status = AgentStatus.STANDBY

    async def _run_sequential_workflow(self, workflow_name: str, context: AgentContext) -> AsyncGenerator[SSEEvent, None]:
        """
        Execute a predefined multi-agent workflow with rich inter-agent context.
        Each step waits for the prior agent to finish and receives their output.
        """
        workflow = WORKFLOW_TEMPLATES[workflow_name]
        agents_used = [self.name]
        accumulated_context = []

        for step in workflow["steps"]:
            agent_key = step["agent"]
            agent = self._team.get(agent_key)
            if not agent:
                continue

            # ── Build an enriched task that includes prior agent findings ──
            enriched_task = step["task"]
            if accumulated_context:
                prior_summary_lines = []
                for prior in accumulated_context:
                    excerpt = prior.get("response", "")[:600]
                    tools_used = prior.get("tools_used", [])
                    tools_str = f" (used: {', '.join(tools_used)})" if tools_used else ""
                    prior_summary_lines.append(f"[{prior['agent']}{tools_str}]:\n{excerpt}")
                prior_block = "\n\n".join(prior_summary_lines)
                enriched_task = f"{step['task']}\n\nContext from previous agents:\n{prior_block}"

            # Handoff
            yield SSEEvent(
                event="agent_handoff",
                data={
                    "from_agent": self.name,
                    "to_agent": agent.name,
                    "task": step["task"],
                    "from_emoji": self.emoji,
                    "to_emoji": agent.emoji,
                    "parallel": False,
                },
            )

            # Build context with accumulated prior results
            agent_context = self._make_context(
                context,
                enriched_task,
                workflow=workflow_name,
                previous_results=accumulated_context,
            )

            # Stream agent events — collect full response + tools used
            agent_response = ""
            agent_tools_used: list[str] = []
            async for event in agent.run(agent_context):
                yield event
                if event.event == "agent_message":
                    agent_response = event.data.get("content", "")
                    agent_tools_used = event.data.get("tools_used", [])

            agents_used.append(agent.name)
            if agent_response:
                accumulated_context.append(
                    {
                        "agent": agent.name,
                        "task": step["task"],
                        "response": agent_response[:900],
                        "tools_used": agent_tools_used,
                    }
                )

        yield SSEEvent(
            event="done",
            data={
                "agents_used": agents_used,
                "trace_id": context.request_id,
                "workflow": workflow_name,
                "parallel": False,
            },
        )
        self.status = AgentStatus.STANDBY

    # ── Context factory ────────────────────────────────────────────────────────

    def _make_context(
        self,
        base: AgentContext,
        task_msg: str,
        workflow: Optional[str] = None,
        previous_results: Optional[list] = None,
    ) -> AgentContext:
        """Create an agent-specific context derived from the base context."""
        shared = {**base.shared_context}
        if workflow:
            shared["workflow"] = workflow
        if previous_results:
            shared["previous_results"] = previous_results

        return AgentContext(
            user_id=base.user_id,
            user_message=task_msg,
            conversation_history=base.conversation_history,
            resume_text=base.resume_text,
            job_description=base.job_description,
            user_state=base.user_state,
            shared_context=shared,
            session_id=base.session_id,
            request_id=base.request_id,
            db=base.db,
            user=base.user,
        )
