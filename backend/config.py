import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # --- Security ---
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-to-a-random-secret-key").strip()
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # --- Database ---
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smart_resume.db").strip()
    if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # --- LLM Configuration ---
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq").strip()  # options: groq, gemini
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "").strip()
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()

    # --- GitHub OAuth ---
    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "").strip()
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "").strip()
    GITHUB_REDIRECT_URI: str = os.getenv(
        "GITHUB_REDIRECT_URI",
        "http://localhost:8000/auth/github/callback"
    ).strip()

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

    def validate(self):
        if not self.GROQ_API_KEY and not self.GEMINI_API_KEY:
            print("WARNING: No LLM API key set. AI analysis will use fallback heuristics.")
        if "sqlite" in self.DATABASE_URL and os.getenv("RAILWAY_ENVIRONMENT"):
            print("WARNING: Using SQLite on Railway. Data will NOT persist between restarts.")
        if not self.GITHUB_CLIENT_ID:
            print("INFO: GITHUB_CLIENT_ID not set. GitHub OAuth will be unavailable.")
        print(f"LLM Provider: {self.LLM_PROVIDER} | DB: {'SQLite' if 'sqlite' in self.DATABASE_URL else 'PostgreSQL'}")

settings = Settings()
settings.validate()