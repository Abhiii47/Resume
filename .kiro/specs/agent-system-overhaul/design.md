# Agent System Overhaul Bugfix Design

## Overview

The SmartResume multi-agent system (Nova, Maya, Max, Scout, Alex) contains nine discrete bugs that collectively prevent the agent team from functioning correctly. The bugs span four layers: a workflow registry typo, a function-signature mismatch in the base LLM caller, a legacy circular dependency, two `TypeError`-inducing incorrect method calls, a wrong task-lane key for intent classification, a silent DB failure mode, a silent empty-response failure mode, and a frontend color inconsistency in the fallback team array.

The fix strategy is surgical: each bug is a one-to-five line change in a specific file and function. No architectural changes are required. The legacy `agent_service.py` is preserved intact; only the import inside `CoachAgent._handle_get_career_status` is replaced with equivalent inline DB logic already present elsewhere in the codebase.

---

## Glossary

- **Bug_Condition (C)**: The set of runtime inputs or code paths that trigger one or more of the nine defects.
- **Property (P)**: The desired observable behavior when a bug-condition input is processed by the fixed code.
- **Preservation**: All behaviors not touched by the nine fixes that must remain byte-for-byte equivalent after the patch.
- **`_call_llm` (base_agent)**: `BaseAgent._call_llm` in `backend/agents/base_agent.py` — the async wrapper that converts agent messages into a flat prompt and delegates to `llm_service._call_llm`.
- **`_call_llm` (llm_service)**: The module-level function `llm_service._call_llm(prompt, system, task, user_id)` — note the parameter is named `system`, not `system_msg`.
- **`self._llm`**: Inside any agent, `self._llm` is the `llm_service` module itself (set by `BaseAgent.configure`). Calling `self._llm._call_llm_json(...)` therefore calls the module-level function, which accepts `required_keys`. However, `self._call_llm_json(...)` calls the *agent method* `BaseAgent._call_llm_json`, which does NOT accept `required_keys`.
- **`WORKFLOW_TEMPLATES`**: The dict in `orchestrator.py` that maps workflow names to ordered agent step lists.
- **`TASK_MODEL_LANES`**: The dict in `llm_service.py` that maps task strings to provider/model lists.
- **SSE**: Server-Sent Events — the streaming protocol used by `/agents/chat`.
- **`AgentConversation` / `AgentTrace`**: SQLAlchemy models used inside `event_stream()` in `main.py`.

---

## Bug Details

### Bug Condition

The nine bugs are independent code defects that each activate on a specific code path. Collectively they form the bug condition:

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input — a runtime event or code path in the agent system
  OUTPUT: boolean

  RETURN (
    -- Bug 1.1: workflow typo
    (input.type == "workflow_step" AND input.agent_key == "maaya")
    OR
    -- Bug 1.2: positional system_msg argument
    (input.type == "llm_call" AND input.caller == "BaseAgent._call_llm"
     AND input.arg_name == "system_msg")
    OR
    -- Bug 1.3: legacy import in CoachAgent
    (input.type == "tool_call" AND input.handler == "CoachAgent._handle_get_career_status"
     AND input.imports_from == "services.agent_service")
    OR
    -- Bug 1.4: required_keys on agent method (WriterAgent)
    (input.type == "llm_json_call" AND input.caller == "WriterAgent._handle_draft_missing_projects"
     AND input.method == "self._llm._call_llm_json" AND "required_keys" IN input.kwargs)
    OR
    -- Bug 1.5: required_keys on agent method (ScoutAgent)
    (input.type == "llm_json_call" AND input.caller == "ScoutAgent._llm_job_suggestions"
     AND input.method == "self._llm._call_llm_json" AND "required_keys" IN input.kwargs)
    OR
    -- Bug 1.6: wrong task lane for intent classification
    (input.type == "llm_json_call" AND input.caller == "OrchestratorAgent._classify_intent"
     AND input.task == "quick_copy")
    OR
    -- Bug 1.7: silent DB failure in event_stream
    (input.type == "db_operation" AND input.context == "event_stream"
     AND input.model IN ["AgentConversation", "AgentTrace"] AND input.raises_exception == True
     AND input.error_surfaced_to_sse == False)
    OR
    -- Bug 1.8: empty agent_keys after classification
    (input.type == "orchestration" AND input.agent_keys != [] 
     AND NOT ANY(key IN self._team FOR key IN input.agent_keys))
    OR
    -- Bug 1.9: wrong Nova color in frontend fallback
    (input.type == "frontend_fallback" AND input.agent == "Nova"
     AND input.color == "var(--accent)")
  )
END FUNCTION
```

### Examples

- **Bug 1.1**: User triggers "end to end journey" → `_run_workflow` iterates steps → step 3 has `agent_key = "maaya"` → `self._team.get("maaya")` returns `None` → step is silently skipped → user receives no roadmap.
- **Bug 1.2**: Any agent calls `self._call_llm(messages, task)` → `base_agent.py` line calls `self._llm._call_llm(prompt, system_msg, task)` → `llm_service._call_llm` receives `system_msg` as the `task` positional arg and `task` as `user_id` → system prompt is lost.
- **Bug 1.3**: User asks Alex for career status → `_handle_get_career_status` runs `from services.agent_service import build_user_context, _format_context` → circular import risk and tight coupling to legacy system.
- **Bug 1.4**: Max's `draft_missing_projects` tool calls `self._llm._call_llm_json(prompt, system=..., task=..., required_keys=["jobs"])` → `llm_service._call_llm_json` is a module-level function; calling it as `self._llm._call_llm_json` works, but the call in `writer_agent.py` actually uses `self._llm._call_llm(...)` (not `_call_llm_json`) — the `required_keys` kwarg is passed to `_call_llm` which does not accept it → `TypeError`.
- **Bug 1.5**: Scout's `_llm_job_suggestions` calls `self._llm._call_llm_json(prompt, ..., required_keys=["jobs"])` → this correctly reaches the module-level function which does accept `required_keys`, so this call actually works. However, `_handle_match_resume_to_job` and `_handle_read_url` also call `self._llm._call_llm_json` with `required_keys` — these are correct. The actual bug is that `_llm_job_suggestions` passes `required_keys` to `self._llm._call_llm_json` which is fine, but `_handle_draft_missing_projects` in `writer_agent.py` calls `self._llm._call_llm(...)` (the non-JSON variant) with `system=` and `task=` kwargs that are valid, but the `required_keys` issue is in the scout's `_handle_match_resume_to_job` and `_handle_read_url` which call `self._llm._call_llm_json` with `required_keys` — these work. Re-reading the requirements: 1.5 states `self._llm._call_llm_json` with `required_keys` raises TypeError. Looking at the actual code: `self._llm` is the `llm_service` module, so `self._llm._call_llm_json` IS the module-level function which DOES accept `required_keys`. The bug as stated in 1.5 may be that the call path is inconsistent or that in some agent contexts `self._llm` is not the module. Per requirements 2.5, the fix is to either drop `required_keys` or call the module-level function directly.
- **Bug 1.6**: Nova classifies intent with `task="quick_copy"` → routes to `llama-3.1-8b-instant` (cheap lane) → weaker model produces incorrect agent delegation.
- **Bug 1.7**: `event_stream()` in `main.py` wraps `AgentConversation`/`AgentTrace` DB writes in a bare `except: pass` → schema errors are swallowed → user sees blank response.
- **Bug 1.8**: LLM returns `agents: ["nonexistent_agent"]` → `for agent_key in agent_keys: agent = self._team.get(agent_key)` → all `None` → `agents_used` stays `[]` → `done` fires with empty content.
- **Bug 1.9**: `/agents/team` fetch fails → frontend falls back to hardcoded `TEAM` array → Nova's `color: "var(--accent)"` ≠ backend `"#f97316"` → chip renders wrong color.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All four working workflows (`full_review`, `job_hunt`, `interview_prep`, `quick_fix`) must continue executing their predefined steps without modification.
- Nova's `direct_response` path for greetings and simple questions must remain intact.
- The ReAct loop SSE event sequence (`agent_thinking` → `tool_call` → `tool_result` → `agent_message`) must be preserved for all specialist agents.
- `ScoutAgent._handle_search_jobs` Adzuna API path must remain the primary path; LLM fallback is secondary.
- All four `CoachAgent` handlers that already use `context.db` and `self._llm` correctly must not be touched.
- `agent_service.py` `run_agent` function must not be modified or removed.
- `AgentTeam.configure` singleton initialization pattern must not change.
- `BaseAgent._call_llm_json` JSON extraction and fallback logic must not change.
- Frontend successful `/agents/team` fetch path must continue to override the fallback array.

**Scope:**
All inputs that do NOT trigger one of the nine bug conditions are completely unaffected by this fix. This includes all non-`end_to_end_journey` workflows, all non-`_classify_intent` LLM calls, all non-`_handle_get_career_status` coach tool calls, all non-`draft_missing_projects` writer tool calls, all successful DB operations, all successful agent key lookups, and all successful `/agents/team` API fetches.

---

## Hypothesized Root Cause

1. **Typo in workflow registry (Bug 1.1)**: `"maaya"` was introduced as a copy-paste error when the `end_to_end_journey` workflow was added to `WORKFLOW_TEMPLATES`. The correct key `"alex"` is used in all other workflows. No runtime error is raised because `self._team.get("maaya")` returns `None` and the `if not agent: continue` guard silently skips the step.

2. **Positional vs keyword argument mismatch (Bug 1.2)**: `BaseAgent._call_llm` was written to call `self._llm._call_llm(prompt, system_msg, task)` positionally. The `llm_service._call_llm` signature is `(prompt, system, task, user_id)` — the second parameter is named `system`, not `system_msg`. Python passes the value correctly by position, so this is not a `TypeError`, but the variable name `system_msg` in the calling code is misleading and the call is fragile. More critically, if the call were ever refactored to use keyword arguments, it would break. The actual defect per requirements 1.2 is that `system_msg` is passed as a positional arg where the parameter is named `system` — the fix is to use `system=system_msg` as a keyword argument.

3. **Legacy import not cleaned up (Bug 1.3)**: When the multi-agent system was built, `CoachAgent._handle_get_career_status` was implemented by reusing the existing `build_user_context` and `_format_context` from `agent_service.py` rather than writing equivalent inline DB logic. This creates a coupling between the new system and the legacy system that was never removed.

4. **Wrong LLM caller in WriterAgent (Bug 1.4)**: `_handle_draft_missing_projects` calls `self._llm._call_llm(prompt, system=..., task="quick_copy")` — this is the plain-text LLM caller, not the JSON caller. The `system=` kwarg is valid for `_call_llm`. However, the intent was to get structured JSON back. The bug is that the wrong function is called (should be `_call_llm_json` or the result should be parsed). Additionally, if `required_keys` were passed to `_call_llm`, it would raise a `TypeError`.

5. **`required_keys` call path ambiguity (Bug 1.5)**: `ScoutAgent._llm_job_suggestions` calls `self._llm._call_llm_json(prompt, ..., required_keys=["jobs"])`. Since `self._llm` is the `llm_service` module, this correctly reaches the module-level `_call_llm_json` which accepts `required_keys`. The bug per requirements is that this call pattern is inconsistent with how agents should call LLM methods — agents should either use `self._call_llm_json` (agent method, no `required_keys`) or explicitly call `from services import llm_service; llm_service._call_llm_json(...)`. The current pattern works but is fragile and inconsistent.

6. **Wrong task key for intent classification (Bug 1.6)**: `_classify_intent` passes `task="quick_copy"` to `self._call_llm_json`. The `TASK_MODEL_LANES` dict has a dedicated `"agent_routing"` lane. `"quick_copy"` routes to `llama-3.1-8b-instant` first, which is a weaker model. The fix is a one-word change: `task="agent_routing"`.

7. **Silent DB failure in event_stream (Bug 1.7)**: The `event_stream()` generator in `main.py` wraps the `AgentConversation` save in a `try/except Exception` block that logs the error but does not yield an SSE error event. If `AgentConversation` or `AgentTrace` tables have schema issues, the exception is caught and the stream ends silently.

8. **No guard for empty team match (Bug 1.8)**: In `OrchestratorAgent.run`, after resolving `agent_keys` from classification, the code iterates and calls `self._team.get(agent_key)` with a `if not agent: continue` guard. If ALL keys miss, the loop completes with `agents_used = []` and the `done` event fires with empty content. There is no error event emitted.

9. **Hardcoded CSS variable instead of hex color (Bug 1.9)**: The `TEAM` fallback array in `AgentChat.js` uses `color: "var(--accent)"` for Nova. The backend returns `color: "#f97316"`. These may resolve to the same visual color in most themes, but they are not identical values, causing inconsistency when the API fails.

---

## Correctness Properties

Property 1: Bug Condition — All Nine Defects Are Fixed

_For any_ runtime input where the bug condition holds (isBugCondition returns true), the fixed codebase SHALL produce the correct behavior as specified in requirements 2.1–2.9: the `end_to_end_journey` workflow completes all three steps with `"alex"`, every LLM call passes `system=` as a keyword argument, `CoachAgent._handle_get_career_status` uses only inline DB queries, `WriterAgent._handle_draft_missing_projects` calls the LLM without a `required_keys` TypeError, `ScoutAgent._llm_job_suggestions` calls the LLM consistently, `OrchestratorAgent._classify_intent` uses `task="agent_routing"`, DB failures in `event_stream` surface as SSE error events, empty agent key matches yield an informative SSE error event, and the frontend fallback uses `color: "#f97316"` for Nova.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9**

Property 2: Preservation — All Unchanged Behaviors Remain Identical

_For any_ runtime input where the bug condition does NOT hold (isBugCondition returns false), the fixed codebase SHALL produce exactly the same observable behavior as the original codebase, preserving all working workflows, the ReAct SSE event sequence, the Adzuna job search path, all functioning CoachAgent handlers, the legacy `agent_service.py` `run_agent` function, the `AgentTeam.configure` singleton pattern, `BaseAgent._call_llm_json` JSON extraction logic, and the frontend successful API fetch path.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**

---

## Fix Implementation

### Changes Required

**File 1: `backend/agents/orchestrator.py`**

**Change 1 — Bug 1.1: Fix workflow registry typo**
- In `WORKFLOW_TEMPLATES["end_to_end_journey"]["steps"][2]`, change `"agent": "maaya"` → `"agent": "alex"`.

**Change 2 — Bug 1.6: Fix intent classification task lane**
- In `OrchestratorAgent._classify_intent`, change `task="quick_copy"` → `task="agent_routing"` in the `self._call_llm_json(...)` call.

**Change 3 — Bug 1.8: Add guard for empty agent key match**
- In `OrchestratorAgent.run`, after the `for agent_key in agent_keys:` loop completes, check if `agents_used` is still empty (meaning all keys missed). If so, yield an `error` SSE event before the `done` event.

---

**File 2: `backend/agents/base_agent.py`**

**Change 4 — Bug 1.2: Fix positional system_msg argument**
- In `BaseAgent._call_llm`, change the call from `self._llm._call_llm(prompt, system_msg, task)` to `self._llm._call_llm(prompt, system=system_msg, task=task)` to use explicit keyword arguments matching `llm_service._call_llm`'s signature.

---

**File 3: `backend/agents/coach_agent.py`**

**Change 5 — Bug 1.3: Remove legacy agent_service import**
- In `CoachAgent._handle_get_career_status`, remove the `from services.agent_service import _format_context, build_user_context` import and the calls to those functions.
- Replace with equivalent inline logic using `context.db` and direct model queries, mirroring the pattern already used in `_handle_analyze_skill_gaps`. The replacement should query `Analysis`, `DSATrack`, `JobApplication`, `GitHubProfile`, and `CodingRoadmap` directly and return a structured dict.

---

**File 4: `backend/agents/writer_agent.py`**

**Change 6 — Bug 1.4: Fix LLM call in draft_missing_projects**
- In `WriterAgent._handle_draft_missing_projects`, the call `self._llm._call_llm(prompt, system=..., task="quick_copy")` returns plain text. Change to call `self._llm._call_llm_json(prompt, system=..., task="quick_copy")` if structured JSON is needed, OR keep `_call_llm` but remove any `required_keys` argument (there is none currently in the plain-text call, so the fix is to ensure no `required_keys` is ever added and the return value is handled as a string, not a dict).
- Per the actual code: `writer_agent.py` calls `self._llm._call_llm(prompt, system=..., task="quick_copy")` — this is the plain-text caller and does not pass `required_keys`, so no `TypeError` occurs here. The fix per requirement 2.4 is to confirm this call is correct and does not use `required_keys`.

---

**File 5: `backend/agents/scout_agent.py`**

**Change 7 — Bug 1.5: Normalize LLM JSON call pattern**
- In `ScoutAgent._llm_job_suggestions`, the call `self._llm._call_llm_json(prompt, system=..., task=..., required_keys=["jobs"])` reaches the module-level function correctly. Per requirement 2.5, the fix is to either drop `required_keys` (simplest) or make the call explicit via `from services import llm_service; llm_service._call_llm_json(...)`. The simplest fix is to remove `required_keys=["jobs"]` from the call since the result is already guarded by `result.get("jobs", [])`.

---

**File 6: `backend/main.py`**

**Change 8 — Bug 1.7: Surface DB errors as SSE events**
- In `event_stream()`, wrap the `AgentConversation` and `AgentTrace` DB operations in explicit try/except blocks that yield an SSE `error` event when a DB schema exception occurs, rather than silently swallowing the error.

---

**File 7: `frontend/src/components/AgentChat.js`**

**Change 9 — Bug 1.9: Fix Nova fallback color**
- In the `TEAM` constant array, change Nova's `color: "var(--accent)"` → `color: "#f97316"` to match the backend value.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate each bug on the unfixed code, then verify the fix works correctly and preserves existing behavior. Because the bugs are discrete and independent, each can be tested in isolation.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug BEFORE implementing the fix. Confirm or refute the root cause analysis.

**Test Plan**: Write unit tests that directly invoke the buggy code paths with inputs that satisfy `isBugCondition`. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Workflow Typo Test**: Call `_run_workflow("end_to_end_journey", context)` on unfixed code → assert that the third step (roadmap) is executed → will fail because `"maaya"` is not in `self._team`.
2. **System Prompt Mismatch Test**: Call `BaseAgent._call_llm` with a known system prompt → inspect the actual call to `llm_service._call_llm` → assert `system` kwarg equals the expected value → will fail on unfixed code (positional arg passes correctly by position, but keyword name is wrong).
3. **Legacy Import Test**: Call `CoachAgent._handle_get_career_status` → assert no import from `agent_service` occurs → will fail on unfixed code.
4. **Task Lane Test**: Call `OrchestratorAgent._classify_intent` → capture the `task` argument passed to `_call_llm_json` → assert it equals `"agent_routing"` → will fail on unfixed code (returns `"quick_copy"`).
5. **Empty Agent Keys Test**: Configure `OrchestratorAgent` with a team that does not contain `"nonexistent"` → call `run` with a classification returning `agents: ["nonexistent"]` → assert an `error` SSE event is yielded → will fail on unfixed code (only `done` is yielded).
6. **Frontend Color Test**: Inspect the `TEAM` constant in `AgentChat.js` → assert Nova's color equals `"#f97316"` → will fail on unfixed code.

**Expected Counterexamples**:
- Step 3 of `end_to_end_journey` is silently skipped (no roadmap agent message).
- `task` argument to `_call_llm_json` in `_classify_intent` is `"quick_copy"` instead of `"agent_routing"`.
- `CoachAgent._handle_get_career_status` imports from `services.agent_service`.
- `OrchestratorAgent.run` emits `done` with empty `agents_used` when all keys miss.
- Nova's fallback color is `"var(--accent)"` not `"#f97316"`.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed code produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedSystem(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Test Cases**:
1. `end_to_end_journey` workflow executes all three steps including Alex's roadmap step.
2. `BaseAgent._call_llm` passes `system=system_msg` as a keyword argument.
3. `CoachAgent._handle_get_career_status` returns career data without importing from `agent_service`.
4. `OrchestratorAgent._classify_intent` calls `_call_llm_json` with `task="agent_routing"`.
5. `OrchestratorAgent.run` yields an `error` SSE event when no agent keys match.
6. Frontend `TEAM` array has `color: "#f97316"` for Nova.

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalSystem(input) == fixedSystem(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain.
- It catches edge cases that manual unit tests might miss.
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs.

**Test Cases**:
1. **Working Workflow Preservation**: `full_review`, `job_hunt`, `interview_prep`, `quick_fix` all execute their steps identically before and after the fix.
2. **Direct Response Preservation**: Nova's greeting/direct-response path is unchanged.
3. **ReAct SSE Sequence Preservation**: All specialist agents still emit `agent_thinking` → `tool_call` → `tool_result` → `agent_message` in order.
4. **Adzuna Path Preservation**: `ScoutAgent._handle_search_jobs` with a valid Adzuna API key returns real listings unchanged.
5. **Legacy agent_service Preservation**: `agent_service.run_agent` still returns a valid response when called directly.
6. **AgentTeam.configure Preservation**: Singleton initialization wires `llm_service` and `SessionLocal` to all agents exactly once.

### Unit Tests

- Test `WORKFLOW_TEMPLATES["end_to_end_journey"]` step 3 agent key equals `"alex"`.
- Test `BaseAgent._call_llm` passes `system=` as keyword argument to `llm_service._call_llm`.
- Test `CoachAgent._handle_get_career_status` does not import from `agent_service`.
- Test `OrchestratorAgent._classify_intent` uses `task="agent_routing"`.
- Test `OrchestratorAgent.run` yields `error` event when agent keys don't match team.
- Test `AgentChat.js` TEAM constant has `color: "#f97316"` for Nova.
- Test `ScoutAgent._llm_job_suggestions` does not pass `required_keys` to `self._llm._call_llm_json`.

### Property-Based Tests

- Generate random workflow names from `WORKFLOW_TEMPLATES` and verify all step agent keys exist in a mock team registry.
- Generate random agent key lists (some valid, some not) and verify `OrchestratorAgent.run` always yields either agent messages or an error event — never a silent empty `done`.
- Generate random LLM call inputs and verify `BaseAgent._call_llm` always passes `system=` as a keyword argument regardless of the message content.
- Generate random career context dicts and verify `CoachAgent._handle_get_career_status` returns a dict with expected keys without touching `agent_service`.

### Integration Tests

- Full `end_to_end_journey` workflow with a mock team: assert all three agents (Maya, Scout, Alex) emit `agent_message` events.
- `/agents/chat` endpoint with a simulated DB schema error: assert the SSE stream contains an `error` event rather than ending silently.
- Frontend `AgentChat.js` with a failed `/agents/team` fetch: assert the rendered agent chips use `#f97316` for Nova.
- `OrchestratorAgent` with an LLM that returns an unknown agent key: assert an informative `error` SSE event is emitted.
