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
from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=4, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    token: str


class MessageResponse(BaseModel):
    message: str


class VerifyDocumentRequest(BaseModel):
    verification_status: str
    remarks: Optional[str] = ""
class FileUploadResponse(BaseModel):
    filename: str
    path: str


class ItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)


class Item(BaseModel):
    id: int
    name: str
    description: str
    owner: str
