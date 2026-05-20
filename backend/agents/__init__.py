"""SmartResume Multi-Agent System — 5 specialized career placement agents."""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


class AgentTeam:
    """
    Singleton that initializes and manages all agents + message bus.
    Use get_team() to access.
    """

    _instance: Optional["AgentTeam"] = None

    def __init__(self):
        from .message_bus import MessageBus
        from .analyst_agent import AnalystAgent
        from .writer_agent import WriterAgent
        from .scout_agent import ScoutAgent
        from .coach_agent import CoachAgent
        from .orchestrator import OrchestratorAgent

        self.bus = MessageBus()

        # Initialize all specialist agents
        self.maya = AnalystAgent()
        self.max = WriterAgent()
        self.scout = ScoutAgent()
        self.maaya = CoachAgent()
        self.nova = OrchestratorAgent()

        # Register agents in the orchestrator's registry
        self._agents = {
            "nova": self.nova,
            "maya": self.maya,
            "max": self.max,
            "scout": self.scout,
            "maaya": self.maaya,
        }

        # Give orchestrator access to the full team
        self.nova.set_team(self._agents, self.bus)

        logger.info(
            "Agent Team initialized: %s",
            ", ".join(f"{a.emoji} {a.name}" for a in self._agents.values()),
        )

    def configure(self, llm_service_module, db_session_factory):
        """Wire up shared services to every agent."""
        for agent in self._agents.values():
            agent.configure(llm_service_module, db_session_factory, self.bus)

    def get_agent(self, name: str):
        """Get an agent by name (case-insensitive)."""
        return self._agents.get(name.lower())

    def all_agents_info(self) -> list[dict]:
        """Return public info for every agent (for the UI)."""
        return [a.get_info() for a in self._agents.values()]

    @classmethod
    def get_team(cls) -> "AgentTeam":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance


def get_team() -> AgentTeam:
    """Module-level convenience accessor."""
    return AgentTeam.get_team()
