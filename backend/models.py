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
