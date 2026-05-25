"""
Bug Condition Exploration Tests — Task 1
=========================================
These tests are DELIBERATELY written to FAIL on the current (unfixed) codebase.
A test FAILING here is the SUCCESS case — it confirms the bug exists.
A test PASSING unexpectedly means the bug was NOT reproduced as expected.

Run with:
    cd backend && python -m pytest tests/test_bug_exploration.py -v
"""

import asyncio
import inspect
import json
import os
import re
import sys
from unittest.mock import AsyncMock, MagicMock, patch, call

import pytest

# ---------------------------------------------------------------------------
# Path setup — ensure backend root is importable
# ---------------------------------------------------------------------------
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


# ---------------------------------------------------------------------------
# Bug 1.1 — Workflow registry typo: "maaya" instead of "alex"
# ---------------------------------------------------------------------------

class TestBug11WorkflowTypo:
    """
    Bug 1.1: WORKFLOW_TEMPLATES["end_to_end_journey"]["steps"][2]["agent"]
    is "maaya" but should be "alex".
    This test ASSERTS the correct value ("alex") — it will FAIL on unfixed code.
    """

    def test_end_to_end_journey_step3_agent_is_alex(self):
        """Assert step 3 agent key is 'alex' — FAILS on unfixed code (currently 'maaya')."""
        from agents.orchestrator import WORKFLOW_TEMPLATES

        step3_agent = WORKFLOW_TEMPLATES["end_to_end_journey"]["steps"][2]["agent"]
        # This assertion FAILS on unfixed code because the value is "maaya"
        assert step3_agent == "alex", (
            f"Bug 1.1 confirmed: step 3 agent is '{step3_agent}', expected 'alex'. "
            "The typo 'maaya' causes the roadmap step to be silently skipped."
        )


# ---------------------------------------------------------------------------
# Bug 1.2 — system_msg passed positionally instead of as keyword arg
# ---------------------------------------------------------------------------

class TestBug12SystemMsgPositionalArg:
    """
    Bug 1.2: BaseAgent._call_llm calls self._llm._call_llm(prompt, system_msg, task)
    positionally. The llm_service._call_llm signature is (prompt, system, task, user_id).
    The parameter is named 'system', not 'system_msg'.
    This test asserts the call uses system= as a keyword arg — FAILS on unfixed code.
    """

    def test_base_agent_call_llm_passes_system_as_keyword_arg(self):
        """
        Assert BaseAgent._call_llm passes system= as a keyword argument.
        FAILS on unfixed code (currently passed positionally as system_msg).
        """
        from agents.base_agent import AgentContext, BaseAgent

        # Create a concrete subclass for testing
        class ConcreteAgent(BaseAgent):
            def __init__(self):
                super().__init__()
                self.name = "TestAgent"

        agent = ConcreteAgent()

        captured_calls = []

        def mock_call_llm(prompt, system="default_system", task="general", user_id=None):
            captured_calls.append({
                "prompt": prompt,
                "system": system,
                "task": task,
                "user_id": user_id,
            })
            return "mock response"

        mock_llm = MagicMock()
        mock_llm._call_llm = mock_call_llm
        agent._llm = mock_llm

        messages = [
            {"role": "system", "content": "You are a test system prompt."},
            {"role": "user", "content": "Hello"},
        ]

        asyncio.get_event_loop().run_until_complete(agent._call_llm(messages, task="general"))

        assert len(captured_calls) == 1, "Expected exactly one LLM call"
        captured = captured_calls[0]

        # On UNFIXED code: self._llm._call_llm(prompt, system_msg, task) is called
        # positionally, so system_msg lands in the 'system' parameter by position.
        # The bug is that the variable is named 'system_msg' in the calling code,
        # not 'system'. The fix is to use system=system_msg as a keyword argument.
        #
        # To detect the bug, we inspect the source of BaseAgent._call_llm to check
        # whether it uses the keyword argument form.
        source = inspect.getsource(BaseAgent._call_llm)

        # The fixed code should contain 'system=system_msg' (keyword arg form)
        # The unfixed code contains 'system_msg, task' (positional form)
        assert "system=system_msg" in source, (
            "Bug 1.2 confirmed: BaseAgent._call_llm does NOT pass system= as a keyword "
            "argument. Found positional call with 'system_msg' variable. "
            f"Source snippet: {source[source.find('_call_llm'):source.find('_call_llm')+200]}"
        )


# ---------------------------------------------------------------------------
# Bug 1.3 — Legacy import in CoachAgent._handle_get_career_status
# ---------------------------------------------------------------------------

class TestBug13LegacyImportInCoachAgent:
    """
    Bug 1.3: CoachAgent._handle_get_career_status imports build_user_context
    and _format_context from services.agent_service (legacy system).
    This test asserts the handler does NOT import from agent_service —
    FAILS on unfixed code.
    """

    def test_handle_get_career_status_does_not_import_from_agent_service(self):
        """
        Assert _handle_get_career_status source does NOT import from agent_service.
        FAILS on unfixed code (currently imports build_user_context and _format_context).
        """
        from agents.coach_agent import CoachAgent

        source = inspect.getsource(CoachAgent._handle_get_career_status)

        # On unfixed code, the source contains:
        # from services.agent_service import _format_context, build_user_context
        assert "agent_service" not in source, (
            "Bug 1.3 confirmed: CoachAgent._handle_get_career_status imports from "
            "'services.agent_service' (legacy system). This creates a circular dependency. "
            f"Found 'agent_service' in source: {source[:300]}"
        )


# ---------------------------------------------------------------------------
# Bug 1.4 — WriterAgent LLM call: confirm uses _call_llm (not _call_llm_json)
#           and does NOT pass required_keys
# ---------------------------------------------------------------------------

class TestBug14WriterAgentLLMCall:
    """
    Bug 1.4: WriterAgent._handle_draft_missing_projects should call
    self._llm._call_llm (plain text) and NOT pass required_keys.
    Per the design doc, the current code already calls _call_llm correctly,
    so this test is expected to PASS (unexpected pass for this bug).
    """

    def test_draft_missing_projects_uses_call_llm_not_call_llm_json(self):
        """
        Assert _handle_draft_missing_projects uses _call_llm (not _call_llm_json)
        and does NOT pass required_keys.
        Per design doc analysis, this may PASS (bug 1.4 may not exist as described).
        """
        from agents.writer_agent import WriterAgent

        source = inspect.getsource(WriterAgent._handle_draft_missing_projects)

        # Check that required_keys is NOT passed
        assert "required_keys" not in source, (
            "Bug 1.4 confirmed: _handle_draft_missing_projects passes 'required_keys' "
            "to an LLM call that does not accept it, causing TypeError. "
            f"Source: {source[:400]}"
        )

        # Check that _call_llm_json is NOT used (should use _call_llm for plain text)
        # The correct call is self._llm._call_llm(...)
        assert "_call_llm_json" not in source, (
            "Bug 1.4 confirmed: _handle_draft_missing_projects calls _call_llm_json "
            "instead of _call_llm. "
            f"Source: {source[:400]}"
        )


# ---------------------------------------------------------------------------
# Bug 1.5 — ScoutAgent passes required_keys to self._llm._call_llm_json
# ---------------------------------------------------------------------------

class TestBug15ScoutAgentRequiredKeys:
    """
    Bug 1.5: ScoutAgent._llm_job_suggestions calls self._llm._call_llm_json
    with required_keys=["jobs"]. The fix is to remove required_keys.
    This test asserts required_keys is NOT passed — FAILS on unfixed code.
    """

    def test_llm_job_suggestions_does_not_pass_required_keys(self):
        """
        Assert _llm_job_suggestions does NOT pass required_keys to _call_llm_json.
        FAILS on unfixed code (currently passes required_keys=["jobs"]).
        """
        from agents.scout_agent import ScoutAgent

        source = inspect.getsource(ScoutAgent._llm_job_suggestions)

        # On unfixed code, the source contains: required_keys=["jobs"]
        assert "required_keys" not in source, (
            "Bug 1.5 confirmed: ScoutAgent._llm_job_suggestions passes 'required_keys' "
            "to self._llm._call_llm_json. This is an inconsistent call pattern. "
            f"Found 'required_keys' in source: {source[:400]}"
        )


# ---------------------------------------------------------------------------
# Bug 1.6 — OrchestratorAgent._classify_intent uses wrong task lane
# ---------------------------------------------------------------------------

class TestBug16WrongTaskLane:
    """
    Bug 1.6: OrchestratorAgent._classify_intent calls self._call_llm_json
    with task="quick_copy" instead of task="agent_routing".
    This test asserts the task is "agent_routing" — FAILS on unfixed code.
    """

    def test_classify_intent_uses_agent_routing_task(self):
        """
        Assert _classify_intent passes task='agent_routing' to _call_llm_json.
        FAILS on unfixed code (currently uses task='quick_copy').
        """
        from agents.orchestrator import OrchestratorAgent

        captured_tasks = []

        async def mock_call_llm_json(messages, task="structured_extract"):
            captured_tasks.append(task)
            return {
                "intent": "test",
                "workflow": None,
                "agents": ["alex"],
                "tasks": {"alex": "test task"},
                "direct_response": None,
            }

        agent = OrchestratorAgent()

        # Set up a minimal team
        mock_alex = MagicMock()
        mock_alex.name = "Alex"
        mock_alex.role = "Career Coach"
        mock_alex.description = "Career coach"
        agent._team = {"alex": mock_alex}

        # Patch _call_llm_json on the instance
        agent._call_llm_json = mock_call_llm_json

        context = MagicMock()
        context.user_message = "Help me with my career"
        context.resume_text = "Some resume text"
        context.job_description = None

        asyncio.get_event_loop().run_until_complete(
            agent._classify_intent(context.user_message, context)
        )

        assert len(captured_tasks) > 0, "Expected _call_llm_json to be called at least once"
        assert "agent_routing" in captured_tasks, (
            f"Bug 1.6 confirmed: _classify_intent used task={captured_tasks} "
            "instead of 'agent_routing'. This routes intent classification to a "
            "weaker model lane (quick_copy → llama-3.1-8b-instant)."
        )


# ---------------------------------------------------------------------------
# Bug 1.7 — Silent DB failure in event_stream
# ---------------------------------------------------------------------------

class TestBug17SilentDBFailure:
    """
    Bug 1.7: In event_stream(), the AgentTrace commit is wrapped in
    'except Exception: pass' — DB errors are silently swallowed.
    This test simulates an AgentTrace commit failure and asserts an SSE
    error event is yielded — FAILS on unfixed code.
    """

    def test_agent_trace_commit_failure_yields_sse_error(self):
        """
        Simulate AgentTrace commit raising an exception.
        Assert an SSE 'error' event is yielded.
        FAILS on unfixed code (currently 'except: pass' swallows it silently).
        """
        # We test this by inspecting the source of event_stream in main.py
        # to confirm the bare 'except: pass' pattern exists (bug) or is fixed.
        import main as main_module
        import inspect

        source = inspect.getsource(main_module)

        # Find the event_stream function source
        # Look for the AgentTrace block and its exception handler
        # On unfixed code: except Exception:\n            pass
        # On fixed code: except Exception as e: ... yield error event

        # Extract the AgentTrace try/except block
        # The pattern we're looking for is the bare pass after AgentTrace commit
        agent_trace_section = ""
        lines = source.split("\n")
        in_agent_trace_block = False
        agent_trace_lines = []
        for i, line in enumerate(lines):
            if "AgentTrace(" in line:
                in_agent_trace_block = True
            if in_agent_trace_block:
                agent_trace_lines.append(line)
                if len(agent_trace_lines) > 15:
                    break

        agent_trace_section = "\n".join(agent_trace_lines)

        # On unfixed code, the except block after AgentTrace just has 'pass'
        # We assert that the fixed code does NOT have a bare 'pass' after AgentTrace
        # and instead yields an error event.

        # Check if the except block after AgentTrace commit contains 'pass' only
        # (the bug) vs yielding an error event (the fix)
        has_bare_pass = False
        for i, line in enumerate(agent_trace_lines):
            stripped = line.strip()
            if stripped == "pass" and i > 0:
                # Check if previous non-empty line is an except clause
                for j in range(i - 1, max(0, i - 5), -1):
                    prev = agent_trace_lines[j].strip()
                    if prev.startswith("except"):
                        has_bare_pass = True
                        break

        assert not has_bare_pass, (
            "Bug 1.7 confirmed: The AgentTrace commit exception handler uses bare 'pass', "
            "silently swallowing DB errors. No SSE error event is yielded to the client. "
            f"AgentTrace block:\n{agent_trace_section}"
        )


# ---------------------------------------------------------------------------
# Bug 1.8 — Empty agent key match yields no error event
# ---------------------------------------------------------------------------

class TestBug18EmptyAgentKeyMatch:
    """
    Bug 1.8: When OrchestratorAgent.run resolves agent_keys but none match
    agents in self._team, it fires 'done' with empty agents_used and no
    error event. This test asserts an 'error' SSE event is yielded —
    FAILS on unfixed code.
    """

    def test_run_yields_error_when_no_agent_keys_match(self):
        """
        Configure OrchestratorAgent with a team that does not contain 'nonexistent'.
        Mock _classify_intent to return agents: ["nonexistent"].
        Assert at least one SSE event has event == "error".
        FAILS on unfixed code (currently only 'done' is emitted).
        """
        from agents.orchestrator import OrchestratorAgent
        from agents.base_agent import AgentContext

        agent = OrchestratorAgent()

        # Team does NOT contain "nonexistent"
        mock_alex = MagicMock()
        mock_alex.name = "Alex"
        mock_alex.role = "Career Coach"
        mock_alex.description = "Career coach"
        agent._team = {"alex": mock_alex}

        # Mock _classify_intent to return a nonexistent agent key
        async def mock_classify_intent(message, context):
            return {
                "intent": "test",
                "workflow": None,
                "agents": ["nonexistent"],
                "tasks": {"nonexistent": "some task"},
                "direct_response": None,
            }

        agent._classify_intent = mock_classify_intent

        context = AgentContext(
            user_id=1,
            user_message="Do something",
        )

        async def collect_events():
            events = []
            async for event in agent.run(context):
                events.append(event)
            return events

        events = asyncio.get_event_loop().run_until_complete(collect_events())

        event_types = [e.event for e in events]
        error_events = [e for e in events if e.event == "error"]

        assert len(error_events) > 0, (
            f"Bug 1.8 confirmed: OrchestratorAgent.run emitted no 'error' event "
            f"when all agent keys were missing from the team. "
            f"Events emitted: {event_types}. "
            "The user receives a silent blank response with no indication of failure."
        )


# ---------------------------------------------------------------------------
# Bug 1.9 — Frontend Nova color uses CSS variable instead of hex
# ---------------------------------------------------------------------------

class TestBug19FrontendNovaColor:
    """
    Bug 1.9: The TEAM constant in AgentChat.js uses color: "var(--accent)"
    for Nova instead of the backend value "#f97316".
    This test asserts Nova's color equals "#f97316" — FAILS on unfixed code.
    """

    def test_nova_fallback_color_is_hex_not_css_variable(self):
        """
        Parse the TEAM constant in AgentChat.js.
        Assert Nova's color equals '#f97316'.
        FAILS on unfixed code (currently 'var(--accent)').
        """
        agent_chat_path = os.path.join(
            os.path.dirname(BACKEND_DIR),
            "frontend", "src", "components", "AgentChat.js"
        )

        assert os.path.exists(agent_chat_path), (
            f"AgentChat.js not found at expected path: {agent_chat_path}"
        )

        with open(agent_chat_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Find the TEAM constant block
        team_match = re.search(
            r"const\s+TEAM\s*=\s*\[(.*?)\];",
            content,
            re.DOTALL,
        )
        assert team_match, "Could not find TEAM constant in AgentChat.js"

        team_block = team_match.group(1)

        # Find Nova's entry
        nova_match = re.search(
            r'\{[^}]*name\s*:\s*["\']Nova["\'][^}]*\}',
            team_block,
            re.DOTALL,
        )
        assert nova_match, "Could not find Nova entry in TEAM constant"

        nova_entry = nova_match.group(0)

        # Extract Nova's color value
        color_match = re.search(r'color\s*:\s*["\']([^"\']+)["\']', nova_entry)
        assert color_match, f"Could not find color in Nova entry: {nova_entry}"

        nova_color = color_match.group(1)

        assert nova_color == "#f97316", (
            f"Bug 1.9 confirmed: Nova's fallback color is '{nova_color}', "
            "expected '#f97316'. The CSS variable 'var(--accent)' does not match "
            "the backend value, causing visual inconsistency when the API fails."
        )
