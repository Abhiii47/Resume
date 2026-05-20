import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # --- Security ---
    SECRET_KEY: str = os.getenv("SECRET_KEY", "").strip()
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # --- Database (Neon PostgreSQL recommended) ---
    DEFAULT_SQLITE_PATH = Path(__file__).resolve().parent / "smart_resume.db"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}",
    ).strip()
    # Neon/Railway sometimes use postgres:// — normalize to postgresql://
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # --- LLM Configuration ---
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq").strip()  # options: groq, gemini
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()

    # --- Adzuna Job Discovery ---
    ADZUNA_APP_ID: str = os.getenv("ADZUNA_APP_ID", "").strip()
    ADZUNA_APP_KEY: str = os.getenv("ADZUNA_APP_KEY", "").strip()
    # Countries to query for worldwide job discovery (ISO 2-letter codes)
    ADZUNA_COUNTRIES: list[str] = [
        c.strip() for c in
        os.getenv("ADZUNA_COUNTRIES", "us,gb,in,de,fr,au,ca,nl,sg,br").split(",")
        if c.strip()
    ]

    # --- GitHub OAuth ---
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "").strip()
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "").strip()
    GITHUB_REDIRECT_URI: str = os.getenv(
        "GITHUB_REDIRECT_URI",
        "http://localhost:8000/auth/github/callback"
    ).strip()
    GITHUB_STATE_TTL_SECONDS: int = int(os.getenv("GITHUB_STATE_TTL_SECONDS", "600"))
    FRONTEND_APP_URL: str = os.getenv("FRONTEND_APP_URL", "").strip()

    # --- CORS ---
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://localhost:8000"
        ).split(",")
        if origin.strip()
    ]
    ALLOWED_ORIGIN_REGEX: str | None = os.getenv(
        "ALLOWED_ORIGIN_REGEX",
        r"https://.*\.vercel\.app|http://192\.168\.\d+\.\d+:\d+|http://10\.\d+\.\d+\.\d+:\d+"
    )
    ADMIN_EMAILS: list[str] = [
        email.strip().lower()
        for email in os.getenv("ADMIN_EMAILS", "").split(",")
        if email.strip()
    ]
    RESUME_ENCRYPTION_KEY: str = os.getenv("RESUME_ENCRYPTION_KEY", "").strip()

    def is_admin_email(self, email: str) -> bool:
        return bool(email and email.strip().lower() in self.ADMIN_EMAILS)

    def validate(self):
        """Validate critical settings on startup."""
        # Security: SECRET_KEY must be set and not a placeholder
        _insecure_defaults = {"", "change-this-to-a-random-secret-key", "your_secret_key_here"}
        if self.SECRET_KEY in _insecure_defaults:
            print("=" * 60)
            print("FATAL: SECRET_KEY is not set or is a placeholder!")
            print("Generate one: python -c \"import secrets; print(secrets.token_hex(32))\"")
            print("Set it in your .env file.")
            print("=" * 60)
            raise RuntimeError("SECRET_KEY must be set to a secure random value.")

        # Database warning
        if "sqlite" in self.DATABASE_URL:
            if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("VERCEL"):
                raise RuntimeError(
                    "SQLite detected in production. Set DATABASE_URL to a Neon/Supabase PostgreSQL URL. "
                    "Data WILL be lost on every deployment restart with SQLite."
                )
            print("INFO: Using SQLite (development mode). For production, use Neon PostgreSQL.")
        else:
            print(f"DB: PostgreSQL connected")

        # LLM
        if not self.GROQ_API_KEY and not self.GEMINI_API_KEY:
            print("WARNING: No LLM API key set. AI analysis will use fallback heuristics only.")
        else:
            providers = []
            if self.GROQ_API_KEY:
                providers.append(f"Groq ({self.GROQ_MODEL})")
            if self.GEMINI_API_KEY:
                providers.append("Gemini")
            print(f"LLM: {' + '.join(providers)} (primary: {self.LLM_PROVIDER})")

        # Adzuna
        if not self.ADZUNA_APP_ID or not self.ADZUNA_APP_KEY:
            print("INFO: Adzuna API keys not set. Job discovery will be unavailable.")
        else:
            print(f"Jobs: Adzuna configured ({len(self.ADZUNA_COUNTRIES)} countries)")

        # GitHub OAuth
        if not self.GITHUB_CLIENT_ID:
            print("INFO: GITHUB_CLIENT_ID not set. GitHub OAuth will be unavailable.")
        elif not self.GITHUB_CLIENT_SECRET:
            raise RuntimeError("GITHUB_CLIENT_SECRET is required when GitHub OAuth is enabled.")

        if self.ADMIN_EMAILS:
            print(f"Admin: {len(self.ADMIN_EMAILS)} admin email(s) configured")

settings = Settings()
settings.validate()
