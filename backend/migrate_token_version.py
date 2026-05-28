import os
import sys

from sqlalchemy import text
from config import settings
from database import engine

def migrate():
    print("Applying token_version migration...")
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 1 NOT NULL;"))
        conn.commit()
    print("Migration successful.")

if __name__ == "__main__":
    migrate()
