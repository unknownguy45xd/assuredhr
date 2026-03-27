import secrets
from typing import Dict

from fastapi import Header, HTTPException, status

# Simple in-memory stores
users: Dict[str, str] = {}
tokens_to_users: Dict[str, str] = {}


def register_user(username: str, password: str) -> None:
    if username in users:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    users[username] = password


def login_user(username: str, password: str) -> str:
    if username not in users or users[username] != password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = secrets.token_hex(24)
    tokens_to_users[token] = username
    return token


def get_current_user(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization format")

    token = parts[1].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    username = tokens_to_users.get(token)
    if username is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired token")

    return username
