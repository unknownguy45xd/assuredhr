from pathlib import Path
from typing import List

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from auth import get_current_user, login_user, register_user
from models import (
    FileUploadResponse,
    Item,
    ItemCreate,
    MessageResponse,
    TokenResponse,
    UserLogin,
    UserRegister,
)

app = FastAPI(title="AssuredHR Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path("uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)

items: List[Item] = []


@app.get("/health", response_model=MessageResponse)
def health_check() -> MessageResponse:
    return MessageResponse(message="Backend is running")


@app.post("/auth/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister) -> MessageResponse:
    register_user(payload.username, payload.password)
    return MessageResponse(message="User registered successfully")


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: UserLogin) -> TokenResponse:
    token = login_user(payload.username, payload.password)
    return TokenResponse(token=token)


@app.get("/auth/me", response_model=MessageResponse)
def me(current_user: str = Depends(get_current_user)) -> MessageResponse:
    return MessageResponse(message=f"Authenticated as {current_user}")


@app.post("/upload", response_model=FileUploadResponse)
def upload_file(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
) -> FileUploadResponse:
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required")

    safe_name = Path(file.filename).name
    destination = uploads_dir / safe_name

    with destination.open("wb") as out_file:
        out_file.write(file.file.read())

    return FileUploadResponse(filename=safe_name, path=str(destination))


@app.get("/items", response_model=List[Item])
def list_items(current_user: str = Depends(get_current_user)) -> List[Item]:
    return items


@app.post("/items", response_model=Item, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, current_user: str = Depends(get_current_user)) -> Item:
    new_item = Item(
        id=len(items) + 1,
        name=payload.name,
        description=payload.description,
        owner=current_user,
    )
    items.append(new_item)
    return new_item
