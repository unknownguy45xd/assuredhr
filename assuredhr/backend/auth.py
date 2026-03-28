import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from bson import ObjectId

from db import find_one, insert_one

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# -------------------------
# USER REGISTER
# -------------------------
async def register_user(email: str, password: str, full_name: str = "Admin User", role: str = "admin"):
    existing = await find_one("users", {"email": email.lower().strip()})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    user = await insert_one(
        "users",
        {
            "email": email.lower().strip(),
            "full_name": full_name,
            "role": role,
            "password_hash": pwd_context.hash(password),
            "is_active": True,
        },
    )

    user.pop("password_hash", None)
    return user


# -------------------------
# LOGIN
# -------------------------
async def authenticate_user(email: str, password: str):
    user = await find_one("users", {"email": email.lower().strip()})
    if not user:
        return None

    password_hash = user.get("password_hash", "")
    if not pwd_context.verify(password, password_hash):
        return None

    return user


# -------------------------
# JWT CREATE
# -------------------------
def create_access_token(user_id: str, email: str, role: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)

    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": expires_at,
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


# -------------------------
# JWT DECODE
# -------------------------
def decode_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or expired token")


# -------------------------
# GET CURRENT USER
# -------------------------
async def get_current_user(authorization: str | None = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization format")

    token = parts[1].strip()
    payload = decode_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token payload")

    # Try finding by ObjectId first
    try:
        user = await find_one("users", {"_id": ObjectId(user_id)})
    except Exception:
        user = None

    # fallback by email
    if not user:
        user = await find_one("users", {"email": payload.get("email")})

    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not found")

    user.pop("password_hash", None)
    return user


# -------------------------
# AUTH DEPENDENCY
# -------------------------
async def require_auth(user=Depends(get_current_user)):
    return user