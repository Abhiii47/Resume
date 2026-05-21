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
        "steps": [
            {"agent": "maya", "task": "Score and analyze the resume for flaws"},
            {"agent": "max", "task": "Rewrite the top 3 weakest bullet points"},
            {"agent": "alex", "task": "Provide strategic career advice based on the analysis"},
        ],
    },
    "job_hunt": {
        "description": "Find matching jobs and prepare applications",
        "steps": [
            {"agent": "scout", "task": "Search for matching jobs based on the user's skills"},
            {"agent": "maya", "task": "Analyze resume fit for the top matching job"},
            {"agent": "max", "task": "Generate a tailored cover letter for the best match"},
        ],
    },
    "interview_prep": {
        "description": "Prepare for interviews",
        "steps": [
            {"agent": "maya", "task": "Identify skill gaps and weak areas in the resume"},
            {"agent": "alex", "task": "Generate interview questions and preparation tips"},
        ],
    },
    "quick_fix": {
        "description": "Quick resume improvements",
        "steps": [
            {"agent": "maya", "task": "Identify the top 3 most critical resume flaws"},
            {"agent": "max", "task": "Rewrite and fix the identified flaws"},
        ],
    },
    "end_to_end_journey": {
        "description": "Complete career journey: analyze resume, find jobs, find gaps, and generate learning roadmap",
        "steps": [
            {"agent": "maya", "task": "Analyze the resume to extract current skills and identify areas of improvement"},
            {
                "agent": "scout",
                "task": "Search for top matching jobs based on the user's skills and compare the resume against the best job",
            },
            {
                "agent": "maaya",
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
                task="quick_copy",
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
        # But not just "job" in context of other things
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

    async def run(self, context: AgentContext) -> AsyncGenerator[SSEEvent, None]:
        """
        Nova's orchestration flow:
        1. Classify intent
        2. If direct response → reply immediately
        3. If workflow → execute predefined multi-agent workflow
        4. If specific agents → delegate and synthesize
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
            # Fallback: Alex handles general questions
            agent_keys = ["alex"]
            tasks = {"alex": context.user_message}

        agents_used = []
        all_results = []

        for agent_key in agent_keys:
            agent = self._team.get(agent_key)
            if not agent:
                continue

            task_msg = tasks.get(agent_key, context.user_message)

            # Announce handoff
            yield SSEEvent(
                event="agent_handoff",
                data={
                    "from_agent": self.name,
                    "to_agent": agent.name,
                    "task": task_msg[:100],
                    "from_emoji": self.emoji,
                    "to_emoji": agent.emoji,
                },
            )

            # Create agent-specific context
            agent_context = AgentContext(
                user_id=context.user_id,
                user_message=task_msg,
                conversation_history=context.conversation_history,
                resume_text=context.resume_text,
                job_description=context.job_description,
                user_state=context.user_state,
                shared_context={**context.shared_context, "previous_results": all_results},
                session_id=context.session_id,
                request_id=context.request_id,
                db=context.db,
                user=context.user,
            )

            # Run the specialist agent — stream its events through
            agent_response = ""
            async for event in agent.run(agent_context):
                yield event
                # Capture the final message for synthesis
                if event.event == "agent_message":
                    agent_response = event.data.get("content", "")

            agents_used.append(agent.name)
            if agent_response:
                all_results.append(
                    {
                        "agent": agent.name,
                        "response": agent_response[:1000],
                    }
                )

        # Done event
        yield SSEEvent(
            event="done",
            data={
                "agents_used": agents_used,
                "trace_id": context.request_id,
            },
        )
        self.status = AgentStatus.STANDBY

    async def _run_workflow(self, workflow_name: str, context: AgentContext) -> AsyncGenerator[SSEEvent, None]:
        """Execute a predefined multi-agent workflow with rich inter-agent context."""
        workflow = WORKFLOW_TEMPLATES[workflow_name]

        # Announce the workflow
        self.status = AgentStatus.ACTIVE
        yield SSEEvent(
            event="agent_message",
            data={
                "agent": self.name,
                "emoji": self.emoji,
                "color": self.color,
                "role": self.role,
                "content": (
                    f"🚀 Starting **{workflow_name.replace('_', ' ').title()}** workflow: "
                    f"{workflow['description']}. I'll coordinate the team now."
                ),
                "tools_used": [],
            },
        )

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
                enriched_task = f"{step['task']}\n\n" f"Context from previous agents:\n{prior_block}"

            # Handoff
            yield SSEEvent(
                event="agent_handoff",
                data={
                    "from_agent": self.name,
                    "to_agent": agent.name,
                    "task": step["task"],
                    "from_emoji": self.emoji,
                    "to_emoji": agent.emoji,
                },
            )

            # Build context with accumulated prior results
            agent_context = AgentContext(
                user_id=context.user_id,
                user_message=enriched_task,
                conversation_history=context.conversation_history,
                resume_text=context.resume_text,
                job_description=context.job_description,
                user_state=context.user_state,
                shared_context={
                    **context.shared_context,
                    "workflow": workflow_name,
                    "previous_results": accumulated_context,
                },
                session_id=context.session_id,
                request_id=context.request_id,
                db=context.db,
                user=context.user,
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
            },
        )
        self.status = AgentStatus.STANDBY
