# Implementation Plan: Agent System Overhaul (Bugfix)

## Overview

Nine discrete bugs prevent the SmartResume multi-agent system from functioning correctly. The fix strategy is surgical — one-to-five line changes per file, no architectural changes. This plan first confirms each bug exists via exploration tests (expected to fail on unfixed code), then applies each fix, and finally verifies all bugs are resolved and no regressions were introduced.

## Tasks

- [x] 1. Write bug condition exploration tests (EXPECTED TO FAIL on unfixed code)
  - Create `backend/tests/test_bug_exploration.py` with one test per bug condition
  - These tests are **deliberately written to fail** on the current codebase — a passing test here means the bug does NOT exist (unexpected pass)
  - **Bug 1.1 — Workflow typo**: Assert `WORKFLOW_TEMPLATES["end_to_end_journey"]["steps"][2]["agent"] == "alex"` → will FAIL (currently `"maaya"`)
  - **Bug 1.2 — system_msg positional arg**: Patch `llm_service._call_llm` and call `BaseAgent._call_llm`; assert the captured `system` keyword arg equals the expected system prompt → will FAIL (currently passed positionally with wrong variable name)
  - **Bug 1.3 — Legacy import in CoachAgent**: Inspect `CoachAgent._handle_get_career_status` source or mock `services.agent_service`; assert the handler does NOT import from `agent_service` → will FAIL (currently imports `build_user_context` and `_format_context`)
  - **Bug 1.4 — WriterAgent LLM call**: Patch `llm_service._call_llm` and call `WriterAgent._handle_draft_missing_projects`; assert the call uses `self._llm._call_llm` (not `_call_llm_json`) and does NOT pass `required_keys` → confirm current call signature
  - **Bug 1.5 — ScoutAgent required_keys**: Patch `llm_service._call_llm_json` and call `ScoutAgent._llm_job_suggestions`; assert `required_keys` is NOT passed to `self._llm._call_llm_json` → will FAIL (currently passes `required_keys=["jobs"]`)
  - **Bug 1.6 — Wrong task lane**: Patch `BaseAgent._call_llm_json` and call `OrchestratorAgent._classify_intent`; assert the captured `task` argument equals `"agent_routing"` → will FAIL (currently `"quick_copy"`)
  - **Bug 1.7 — Silent DB failure**: In `event_stream`, simulate an `AgentTrace` commit raising an exception; assert an SSE `error` event is yielded → will FAIL (currently `except: pass` swallows it silently)
  - **Bug 1.8 — Empty agent key match**: Configure `OrchestratorAgent` with a team that does not contain `"nonexistent"`; mock `_classify_intent` to return `{"agents": ["nonexistent"], "workflow": None, "direct_response": None, "tasks": {}}`; collect all SSE events from `run`; assert at least one event has `event == "error"` → will FAIL (currently only `done` is emitted)
  - **Bug 1.9 — Frontend Nova color**: Parse the `TEAM` constant in `AgentChat.js`; assert Nova's `color` equals `"#f97316"` → will FAIL (currently `"var(--accent)"`)
  - Run the tests and confirm they all fail (or note any that unexpectedly pass)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 2. Fix `orchestrator.py` — three bugs in one file
  - [x] 2.1 Fix Bug 1.1: workflow registry typo
    - In `WORKFLOW_TEMPLATES["end_to_end_journey"]["steps"][2]`, change `"agent": "maaya"` → `"agent": "alex"`
    - One-character change on one line
    - _Requirements: 2.1_
  - [x] 2.2 Fix Bug 1.6: wrong task lane for intent classification
    - In `OrchestratorAgent._classify_intent`, change `task="quick_copy"` → `task="agent_routing"` in the `self._call_llm_json(...)` call
    - One-word change on one line
    - _Requirements: 2.6_
  - [x] 2.3 Fix Bug 1.8: add guard for empty agent key match
    - In `OrchestratorAgent.run`, after the `for agent_key in agent_keys:` loop completes, add a check: if `agents_used` is still empty, yield an `error` SSE event with a descriptive message before the `done` event
    - Two-to-four line addition
    - _Requirements: 2.8_

- [x] 3. Fix `base_agent.py` — Bug 1.2: positional system_msg argument
  - In `BaseAgent._call_llm`, change the call from:
    `result = await asyncio.to_thread(self._llm._call_llm, prompt, system_msg, task)`
    to:
    `result = await asyncio.to_thread(self._llm._call_llm, prompt, system=system_msg, task=task)`
  - This ensures the system prompt is passed as the `system` keyword argument matching `llm_service._call_llm`'s signature, not as a positional arg with a mismatched name
  - One-line change
  - _Requirements: 2.2_

- [x] 4. Fix `coach_agent.py` — Bug 1.3: remove legacy agent_service import
  - In `CoachAgent._handle_get_career_status`, remove the `from services.agent_service import _format_context, build_user_context` import and the calls to those functions
  - Replace with equivalent inline DB logic using `context.db` and direct model queries, mirroring the pattern already used in `_handle_analyze_skill_gaps`
  - Query `Analysis`, `DSATrack`, `JobApplication`, `GitHubProfile`, and `CodingRoadmap` directly from `context.db` and return a structured dict with the same keys (`raw` and `formatted`)
  - Do NOT modify `agent_service.py` itself — the legacy `run_agent` function must remain intact
  - _Requirements: 2.3, 3.6_

- [x] 5. Fix `writer_agent.py` — Bug 1.4: confirm/fix LLM call in draft_missing_projects
  - In `WriterAgent._handle_draft_missing_projects`, verify the call `self._llm._call_llm(prompt, system=..., task="quick_copy")` is the plain-text caller and does NOT pass `required_keys`
  - The current code already calls `_call_llm` (not `_call_llm_json`) and does not pass `required_keys`, so no `TypeError` occurs — confirm this is correct and the return value is handled as a string (`bullets.strip()`)
  - If any `required_keys` argument is present, remove it; if the call is to `_call_llm_json` instead of `_call_llm`, change it back to `_call_llm`
  - _Requirements: 2.4_

- [x] 6. Fix `scout_agent.py` — Bug 1.5: normalize LLM JSON call pattern
  - In `ScoutAgent._llm_job_suggestions`, remove `required_keys=["jobs"]` from the `self._llm._call_llm_json(...)` call
  - The result is already guarded by `result.get("jobs", [])`, so removing `required_keys` does not reduce safety
  - This eliminates the inconsistent call pattern where `required_keys` is passed through `self._llm` (the module) rather than through the agent method
  - One-line change (remove one keyword argument)
  - _Requirements: 2.5_

- [x] 7. Fix `main.py` — Bug 1.7: surface DB errors as SSE events
  - In `event_stream()`, the `AgentTrace` save at the end of the function is wrapped in a bare `except: pass` block — change this to an explicit `except Exception as e:` that yields an SSE `error` event before closing the DB session
  - Also verify the `AgentConversation` commit inside the main `try` block is covered by the outer `except Exception as e:` handler that already yields an error event — confirm it is, or add explicit handling
  - The fix ensures DB schema errors are surfaced to the SSE stream rather than silently swallowed
  - Two-to-four line change
  - _Requirements: 2.7_

- [ ] 8. Fix `AgentChat.js` — Bug 1.9: correct Nova fallback color
  - In the `TEAM` constant array at the top of `frontend/src/components/AgentChat.js`, change Nova's entry from:
    `{ name: "Nova", role: "Orchestrator", emoji: "🧠", color: "var(--accent)" }`
    to:
    `{ name: "Nova", role: "Orchestrator", emoji: "🧠", color: "#f97316" }`
  - This matches the backend value returned by `/agents/team` and `OrchestratorAgent.color`
  - One-word change on one line
  - _Requirements: 2.9, 3.7_

- [~] 9. Run fix-checking and preservation tests
  - Create `backend/tests/test_bug_fixes.py` with fix-checking tests for all nine bugs
  - **Fix 1.1**: Assert `WORKFLOW_TEMPLATES["end_to_end_journey"]["steps"][2]["agent"] == "alex"`
  - **Fix 1.2**: Patch `llm_service._call_llm`; call `BaseAgent._call_llm`; assert `system` kwarg equals the expected system prompt string
  - **Fix 1.3**: Call `CoachAgent._handle_get_career_status` with a mock `context.db`; assert it returns a dict with career data keys and does NOT raise an import error from `agent_service`
  - **Fix 1.4**: Patch `llm_service._call_llm`; call `WriterAgent._handle_draft_missing_projects` with a mock GitHub service; assert no `TypeError` is raised and the result contains `"suggested_projects"`
  - **Fix 1.5**: Patch `llm_service._call_llm_json`; call `ScoutAgent._llm_job_suggestions`; assert `required_keys` is NOT in the captured call kwargs
  - **Fix 1.6**: Patch `BaseAgent._call_llm_json`; call `OrchestratorAgent._classify_intent`; assert the captured `task` argument equals `"agent_routing"`
  - **Fix 1.7**: Simulate `AgentTrace` commit raising an exception in `event_stream`; collect SSE output; assert an `error` event is present in the stream
  - **Fix 1.8**: Configure `OrchestratorAgent` with a team missing `"nonexistent"`; mock classification to return that key; collect SSE events; assert an `error` event is yielded before `done`
  - **Fix 1.9**: Parse `TEAM` constant in `AgentChat.js`; assert Nova's `color == "#f97316"`
  - Add preservation tests:
    - Assert `WORKFLOW_TEMPLATES["full_review"]`, `"job_hunt"`, `"interview_prep"`, `"quick_fix"` all have step agent keys that exist in a mock team registry
    - Assert `agent_service.run_agent` is still importable and callable (legacy system intact)
    - Assert `AgentTeam.configure` wires `_llm` and `_db_factory` to all agents
    - Assert `BaseAgent._call_llm_json` still returns a dict from a raw LLM text response
  - Run all tests and confirm they pass
  - _Requirements: 2.1–2.9, 3.1–3.9_

## Notes

- Task 1 tests are **bug condition exploration tests** — they are expected to FAIL on unfixed code. A passing exploration test means the bug was not reproduced as expected (unexpected pass).
- Task 9 tests are **fix-checking and preservation tests** — they are expected to PASS after all fixes are applied.
- Each fix is isolated to a single file and function; fixes are independent and can be applied in any order after Task 1.
- `agent_service.py` must NOT be modified — it is a legacy system that must remain intact (Requirement 3.6).
- The frontend fix (Task 8) is a one-line JS change with no build step required for the test in Task 9.
- Checkpoints: after Task 2 (orchestrator fixes), after Task 7 (all backend fixes), and after Task 9 (full verification).

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2", "3", "4", "5", "6", "7", "8"] },
    { "wave": 3, "tasks": ["9"] }
  ]
}
```

- Task 1 must run first to confirm bugs exist on unfixed code
- Tasks 2–8 are independent and can be applied in any order
- Task 9 must run last to verify all fixes and check for regressions
