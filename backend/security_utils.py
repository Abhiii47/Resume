import base64
import hashlib
from datetime import datetime, timedelta
from typing import Any, Optional

from cryptography.fernet import Fernet, InvalidToken
from jose import JWTError, jwt

from config import settings

RESUME_CIPHERTEXT_PREFIX = "enc:v1:"


def _build_fernet_key() -> bytes:
    raw_key = (settings.RESUME_ENCRYPTION_KEY or settings.SECRET_KEY).strip().encode("utf-8")
    digest = hashlib.sha256(raw_key).digest()
    return base64.urlsafe_b64encode(digest)


_FERNET = Fernet(_build_fernet_key())


def encrypt_resume_text(value: Optional[str]) -> str:
    if not value:
        return ""
    if value.startswith(RESUME_CIPHERTEXT_PREFIX):
        return value
    token = _FERNET.encrypt(value.encode("utf-8")).decode("utf-8")
    return f"{RESUME_CIPHERTEXT_PREFIX}{token}"


def decrypt_resume_text(value: Optional[str]) -> str:
    if not value:
        return ""
    if not value.startswith(RESUME_CIPHERTEXT_PREFIX):
        return value
    token = value[len(RESUME_CIPHERTEXT_PREFIX) :]
    try:
        return _FERNET.decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return ""


def create_signed_state(payload: dict[str, Any], expires_seconds: int) -> str:
    body = payload.copy()
    body.update(
        {
            "purpose": "github_oauth_state",
            "exp": datetime.utcnow() + timedelta(seconds=expires_seconds),
        }
    )
    return jwt.encode(body, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_signed_state(state_token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(state_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid OAuth state") from exc

    if payload.get("purpose") != "github_oauth_state":
        raise ValueError("Invalid OAuth state")

    return payload
