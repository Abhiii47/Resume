# Bugfix Requirements Document

## Introduction

The SmartResume 5-agent AI team (Nova, Maya, Max, Scout, Alex) is the core selling point of the platform, enabling real-time collaborative career placement via SSE streaming. However, a series of interconnected bugs — ranging from a typo in a workflow step to mismatched function signatures and a legacy duplicate system — prevent the agent team from functioning correctly. Users experience silent failures, blank responses, TypeErrors, and inconsistent UI state. This document captures all defective behaviors, the correct behaviors they should be replaced with, and the existing behaviors that must be preserved throughout the fix.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the `end_to_end_journey` workflow is triggered THEN the system silently skips the final roadmap step because the agent key `"maaya"` does not exist in the team registry (correct key is `"alex"`), leaving the user with no personalized learning roadmap.

1.2 WHEN any agent calls `self._call_llm` in `base_agent.py` THEN the system passes `system_msg` as a positional argument to `llm_service._call_llm`, which expects the parameter named `system`, causing a mismatch that results in the system prompt being ignored or an incorrect call being made.

1.3 WHEN `CoachAgent._handle_get_career_status` is invoked THEN the system imports and calls `build_user_context` and `_format_context` from the legacy `agent_service.py`, creating a circular dependency between the new multi-agent system and the old standalone agent system that was never removed.

1.4 WHEN `WriterAgent._handle_draft_missing_projects` calls `self._llm._call_llm_json` with a `required_keys` argument THEN the system raises a `TypeError` because `BaseAgent._call_llm_json` (the method on the agent) does not accept a `required_keys` parameter — that parameter only exists on the module-level `llm_service._call_llm_json`.

1.5 WHEN `ScoutAgent._llm_job_suggestions` calls `self._llm._call_llm_json` with `required_keys` THEN the system raises a `TypeError` for the same reason as 1.4 — `self._llm` is the `llm_service` module, and the module-level `_call_llm_json` is not accessible as an attribute in the way it is being called from the agent context.

1.6 WHEN `OrchestratorAgent._classify_intent` calls `self._call_llm_json` with `task="quick_copy"` THEN the system routes the intent classification request to a weaker, cheaper model lane (`llama-3.1-8b-instant`) instead of the dedicated `"agent_routing"` lane, producing lower-quality intent classification and incorrect agent delegation.

1.7 WHEN the `/agents/chat` endpoint is called and `AgentConversation` or `AgentTrace` DB models have schema mismatches or missing tables THEN the system fails silently, returning no error to the user and producing no agent response.

1.8 WHEN `OrchestratorAgent.run` resolves `agent_keys` from the classification result but none of the keys match agents in `self._team` THEN the system fires a `done` SSE event with an empty `agents_used` list and no content, leaving the user with a blank response and no indication of failure.

1.9 WHEN the frontend `AgentChat.js` fails to fetch `/agents/team` THEN the system silently falls back to the hardcoded `TEAM` array, which uses `color: "var(--accent)"` for Nova instead of the backend value `"#f97316"`, causing a visual inconsistency between the live agent state and the displayed agent chips.

### Expected Behavior (Correct)

2.1 WHEN the `end_to_end_journey` workflow is triggered THEN the system SHALL execute all three steps in order — Maya analyzes the resume, Scout finds matching jobs, and Alex (not `"maaya"`) generates the personalized learning roadmap — delivering a complete career journey response.

2.2 WHEN any agent calls `self._call_llm` in `base_agent.py` THEN the system SHALL pass the system message using the correct keyword argument name `system` (matching `llm_service._call_llm`'s signature), ensuring the system prompt is applied correctly to every LLM call.

2.3 WHEN `CoachAgent._handle_get_career_status` is invoked THEN the system SHALL retrieve career dashboard data using only the new multi-agent system's own DB access patterns (via `context.db` and direct model queries), without importing from or depending on the legacy `agent_service.py`.

2.4 WHEN `WriterAgent._handle_draft_missing_projects` needs to call the LLM for JSON output THEN the system SHALL call `self._llm._call_llm_json` without the `required_keys` argument (since `BaseAgent._call_llm_json` does not support it), or SHALL call the module-level `llm_service._call_llm_json` directly with `required_keys` if schema validation is needed.

2.5 WHEN `ScoutAgent._llm_job_suggestions` needs to call the LLM for JSON output THEN the system SHALL call `self._llm._call_llm_json` without the `required_keys` argument, or SHALL call the module-level `llm_service._call_llm_json` directly with `required_keys` if schema validation is needed.

2.6 WHEN `OrchestratorAgent._classify_intent` calls `self._call_llm_json` THEN the system SHALL use `task="agent_routing"` so that the intent classification is routed to the correct model lane defined in `TASK_MODEL_LANES`, producing accurate agent delegation decisions.

2.7 WHEN the `/agents/chat` endpoint is called and a DB schema issue exists with `AgentConversation` or `AgentTrace` THEN the system SHALL surface a clear error event to the SSE stream (or return an HTTP error) so the user and developer are aware of the failure rather than receiving a silent blank response.

2.8 WHEN `OrchestratorAgent.run` resolves `agent_keys` but none match agents in `self._team` THEN the system SHALL yield an informative `error` SSE event explaining that no matching agents were found, rather than silently firing `done` with empty content.

2.9 WHEN the frontend `AgentChat.js` falls back to the hardcoded `TEAM` array because the `/agents/team` API call fails THEN the system SHALL use `color: "#f97316"` for Nova in the fallback array, matching the value returned by the backend, so the UI is visually consistent regardless of whether the API call succeeds.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user sends a greeting or simple question to the agent chat THEN the system SHALL CONTINUE TO have Nova respond directly via `direct_response` without delegating to any specialist agent.

3.2 WHEN the `full_review`, `job_hunt`, `interview_prep`, and `quick_fix` workflows are triggered THEN the system SHALL CONTINUE TO execute their predefined steps in order, streaming SSE events for each agent handoff and message.

3.3 WHEN any specialist agent (Maya, Max, Scout, Alex) runs its ReAct loop THEN the system SHALL CONTINUE TO stream `agent_thinking`, `tool_call`, `tool_result`, and `agent_message` SSE events in the correct sequence.

3.4 WHEN `ScoutAgent._handle_search_jobs` successfully calls the Adzuna API THEN the system SHALL CONTINUE TO return real job listings without falling back to the LLM suggestion path.

3.5 WHEN `CoachAgent._handle_generate_roadmap`, `_handle_interview_prep`, `_handle_analyze_skill_gaps`, and `_handle_github_cross_reference` are invoked THEN the system SHALL CONTINUE TO function correctly using `context.db`, `context.user`, and `self._llm` as they do today.

3.6 WHEN the legacy `agent_service.py` `run_agent` function is called from any existing endpoint that still uses it THEN the system SHALL CONTINUE TO return a valid response — the legacy system must not be broken or removed as part of this fix.

3.7 WHEN the frontend `AgentChat.js` successfully fetches `/agents/team` THEN the system SHALL CONTINUE TO update the `agents` state with the API response, overriding the hardcoded fallback.

3.8 WHEN `AgentTeam.configure` is called at startup THEN the system SHALL CONTINUE TO wire the shared `llm_service` module and `SessionLocal` factory to every agent exactly once, with no change to the singleton initialization pattern.

3.9 WHEN `BaseAgent._call_llm_json` is called from within an agent's ReAct loop THEN the system SHALL CONTINUE TO parse and return a JSON dict from the LLM response, preserving the existing JSON extraction and fallback logic.
