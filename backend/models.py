from typing import Any, Dict, Optional

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4, max_length=128)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4, max_length=128)
    full_name: str = Field(default="Admin User", min_length=1, max_length=100)
    role: str = Field(default="admin", min_length=2, max_length=30)


class AuthResponse(BaseModel):
    access_token: str
    token: str
    token_type: str = "bearer"
    role: str
    user: Dict[str, Any]


class MessageResponse(BaseModel):
    message: str


class VerifyDocumentRequest(BaseModel):
    verification_status: str
    remarks: Optional[str] = ""
