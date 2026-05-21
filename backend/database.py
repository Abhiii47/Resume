from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
    inspect,
    text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

from config import settings
from security_utils import decrypt_resume_text, encrypt_resume_text

# Engine setup
connect_args = {}
engine_kwargs = {"echo": False}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL (Neon) production settings
    connect_args = {"connect_timeout": 30}
    engine_kwargs.update(
        {
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,  # Detect stale connections
            "pool_recycle": 300,  # Recycle connections every 5 min
        }
    )

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Core Auth Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    github_profile = relationship("GitHubProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    coding_roadmaps = relationship("CodingRoadmap", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")
    dsa_tracks = relationship("DSATrack", back_populates="user", cascade="all, delete-orphan")
    resume_profiles = relationship("ResumeProfile", back_populates="user", cascade="all, delete-orphan")
    mentor_conversations = relationship("MentorConversation", back_populates="user", cascade="all, delete-orphan")
    daily_logs = relationship("DailyLog", back_populates="user", cascade="all, delete-orphan")
    agent_conversations = relationship("AgentConversation", back_populates="user", cascade="all, delete-orphan")
    agent_traces = relationship("AgentTrace", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resume_text = Column(Text)
    resume_preview = Column(Text)
    jd_used = Column(String)
    ats_score = Column(Integer)
    score_breakdown = Column(JSON)
    keyword_gaps = Column(JSON)
    suggestions = Column(JSON)
    radar_data = Column(JSON)
    role_alignment = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="analyses")

    def __repr__(self):
        return f"<Analysis(id={self.id}, user_id={self.user_id}, score={self.ats_score})>"


# GitHub Integration
class GitHubProfile(Base):
    __tablename__ = "github_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    github_username = Column(String, nullable=False)
    github_id = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    public_repos = Column(Integer, default=0)
    total_stars = Column(Integer, default=0)
    followers = Column(Integer, default=0)
    top_languages = Column(JSON)
    pinned_repos = Column(JSON)
    recent_commits = Column(JSON)
    contribution_streak = Column(Integer, default=0)
    resume_gaps = Column(JSON)
    github_bonuses = Column(JSON)
    last_synced = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="github_profile")

    def __repr__(self):
        return f"<GitHubProfile(user_id={self.user_id}, github='{self.github_username}')>"


# Coding Roadmap
class CodingRoadmap(Base):
    __tablename__ = "coding_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    target_role = Column(String, nullable=False)
    roadmap_data = Column(JSON)
    completed_topics = Column(JSON, default=list)
    total_topics = Column(Integer, default=0)
    progress_pct = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="coding_roadmaps")

    def __repr__(self):
        return f"<CodingRoadmap(user_id={self.user_id}, role='{self.target_role}', progress={self.progress_pct:.0f}%)>"


# Job Application Tracker
class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    job_url = Column(String, nullable=True)
    jd_text = Column(Text, nullable=True)
    stage = Column(String, default="applied")
    notes = Column(Text, nullable=True)
    salary_range = Column(String, nullable=True)
    date_applied = Column(DateTime, default=datetime.utcnow)
    next_followup = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="applications")

    def __repr__(self):
        return f"<JobApplication(user_id={self.user_id}, company='{self.company}', stage='{self.stage}')>"


# DSA Progress Tracker
class DSATrack(Base):
    __tablename__ = "dsa_tracks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    problem_id = Column(String, nullable=False, index=True)
    platform = Column(String, nullable=False)
    status = Column(String, default="todo")
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="dsa_tracks")

    def __repr__(self):
        return f"<DSATrack(user_id={self.user_id}, problem='{self.problem_id}', status='{self.status}')>"


# Resume Builder Profiles
class ResumeProfile(Base):
    __tablename__ = "resume_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, default="My Resume")
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="resume_profiles")

    def __repr__(self):
        return f"<ResumeProfile(user_id={self.user_id}, title='{self.title}')>"


# Mentor Conversation Memory
class MentorConversation(Base):
    __tablename__ = "mentor_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    tools_used = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="mentor_conversations")

    def __repr__(self):
        return f"<MentorConversation(user_id={self.user_id}, role='{self.role}')>"


# Holistic Daily Activity Log
class DailyLog(Base):
    __tablename__ = "daily_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String, nullable=False)  # dsa|system_design|cs_fundamentals|behavioral|projects|applications
    count = Column(Integer, default=1)
    note = Column(Text, nullable=True)
    log_date = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="daily_logs")

    def __repr__(self):
        return f"<DailyLog(user_id={self.user_id}, cat='{self.category}', date={self.log_date})>"


# Multi-Agent System Tables
class AgentConversation(Base):
    """Individual messages in multi-agent conversations."""

    __tablename__ = "agent_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String, index=True)
    agent_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "user" | "agent" | "system"
    content = Column(Text, nullable=False)
    message_type = Column(String, default="message")  # "message" | "thinking" | "tool_call" | "handoff"
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="agent_conversations")

    def __repr__(self):
        return f"<AgentConversation(agent='{self.agent_name}', role='{self.role}')>"


class AgentTrace(Base):
    """Full trace of a multi-agent collaboration."""

    __tablename__ = "agent_traces"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(String, index=True)
    trace_id = Column(String, unique=True, index=True)
    user_message = Column(Text)
    agents_used = Column(JSON, default=list)
    orchestrator_plan = Column(JSON, default=dict)
    messages = Column(JSON, default=list)
    total_llm_calls = Column(Integer, default=0)
    total_latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="agent_traces")

    def __repr__(self):
        return f"<AgentTrace(trace_id='{self.trace_id}', agents={self.agents_used})>"


class LLMCallLog(Base):
    __tablename__ = "llm_call_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    task = Column(String, nullable=False, index=True)
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    success = Column(Boolean, default=False, nullable=False, index=True)
    latency_ms = Column(Integer, nullable=False, default=0)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    def __repr__(self):
        return (
            f"<LLMCallLog(task='{self.task}', provider='{self.provider}', "
            f"model='{self.model}', success={self.success})>"
        )


class LLMCache(Base):
    __tablename__ = "llm_cache"

    id = Column(Integer, primary_key=True, index=True)
    prompt_hash = Column(String, unique=True, index=True, nullable=False)
    response_payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<LLMCache(hash='{self.prompt_hash}')>"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_column_names(table_name: str):
    return {column["name"] for column in inspect(engine).get_columns(table_name)}


def _ensure_schema_migrations():
    with engine.begin() as connection:
        analysis_columns = _get_column_names("analyses")
        if "resume_text" not in analysis_columns:
            connection.execute(text("ALTER TABLE analyses ADD COLUMN resume_text TEXT"))

        dsa_columns = _get_column_names("dsa_tracks")
        if "completed_at" not in dsa_columns:
            connection.execute(text("ALTER TABLE dsa_tracks ADD COLUMN completed_at TIMESTAMP NULL"))

        # Preserve legacy full-text analyses before normalizing previews to display-only snippets.
        connection.execute(text("""
            UPDATE analyses
            SET resume_text = resume_preview
            WHERE (resume_text IS NULL OR resume_text = '')
              AND resume_preview IS NOT NULL
              AND resume_preview <> ''
        """))
        analysis_rows = connection.execute(text("""
                SELECT id, resume_text, resume_preview
                FROM analyses
                WHERE resume_text IS NOT NULL
                  AND resume_text <> ''
            """)).mappings().all()
        for row in analysis_rows:
            decrypted_text = decrypt_resume_text(row["resume_text"])
            encrypted_text = encrypt_resume_text(decrypted_text)
            updated_preview = decrypted_text[:200] if decrypted_text else (row["resume_preview"] or "")
            if row["resume_text"] != encrypted_text or (row["resume_preview"] or "") != updated_preview:
                connection.execute(
                    text("""
                        UPDATE analyses
                        SET resume_text = :resume_text,
                            resume_preview = :resume_preview
                        WHERE id = :analysis_id
                    """),
                    {
                        "resume_text": encrypted_text,
                        "resume_preview": updated_preview,
                        "analysis_id": row["id"],
                    },
                )

        # Backfill completion timestamps so the DSA tracker can calculate streaks and contribution history.
        connection.execute(text("""
            UPDATE dsa_tracks
            SET completed_at = COALESCE(completed_at, updated_at, created_at)
            WHERE status = 'done'
        """))
        connection.execute(text("""
            UPDATE dsa_tracks
            SET completed_at = NULL
            WHERE status <> 'done'
        """))


def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        _ensure_schema_migrations()
        print("SUCCESS: Database initialized - all tables created")
    except Exception as e:
        print(f"ERROR: Database initialization failed: {e}")
        raise e


if __name__ == "__main__":
    init_db()
