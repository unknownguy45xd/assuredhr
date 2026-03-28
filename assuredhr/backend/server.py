import io
import os
from datetime import datetime, timezone
from typing import Any, Dict, List

import cloudinary
import cloudinary.uploader
from bson import ObjectId
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from auth import authenticate_user, create_access_token, register_user, require_auth
from db import db, find_many, find_one, insert_one, update_one
from models import AuthResponse, LoginRequest, MessageResponse, RegisterRequest, VerifyDocumentRequest

app = FastAPI(title="AssuredHR Backend", version="2.0.0")
from pathlib import Path
from typing import List

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware

from auth import get_current_user, authenticate_user, create_access_token, register_user
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

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


@app.get("/health", response_model=MessageResponse)
async def health_check() -> MessageResponse:
    return MessageResponse(message="Backend is running")


@app.post("/auth/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def auth_register(payload: RegisterRequest) -> MessageResponse:
    await register_user(payload.email, payload.password, payload.full_name, payload.role)
    return MessageResponse(message="User registered successfully")


@app.post("/auth/login", response_model=AuthResponse)
async def auth_login(payload: LoginRequest) -> AuthResponse:
    user = await authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user["id"], user["email"], user.get("role", "admin"))
    return AuthResponse(
        access_token=token,
        token=token,
        role=user.get("role", "admin"),
        user={
            "id": user["id"],
            "email": user["email"],
            "full_name": user.get("full_name", user["email"]),
            "role": user.get("role", "admin"),
        },
    )


@app.get("/auth/me")
async def auth_me(current_user: Dict[str, Any] = Depends(require_auth)):
    return current_user


def parse_id(doc_id: str) -> ObjectId:
    try:
        return ObjectId(doc_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")


def apply_status_filter(query: Dict[str, Any], status_value: str | None):
    if status_value:
        query["status"] = status_value


async def generic_list(collection: str, status_value: str | None = None):
    query: Dict[str, Any] = {}
    apply_status_filter(query, status_value)
    return await find_many(collection, query)


@app.get("/api/dashboard/stats")
async def dashboard_stats(current_user: Dict[str, Any] = Depends(require_auth)):
    employees = await db["employees"].count_documents({})
    guards = await db["guards"].count_documents({})
    sites = await db["sites"].count_documents({})
    clients = await db["clients"].count_documents({})
    pending_leaves = await db["leave_requests"].count_documents({"status": "pending"})
    return {
        "total_employees": employees,
        "total_guards": guards,
        "total_sites": sites,
        "total_clients": clients,
        "pending_leaves": pending_leaves,
    }


@app.get("/api/admin/users")
async def list_admin_users(current_user: Dict[str, Any] = Depends(require_auth)):
    users = await find_many("users")
    for user in users:
        user.pop("password_hash", None)
    return users


# CRUD routes for key frontend collections
CRUD_COLLECTIONS = {
    "employees": "employees",
    "guards": "guards",
    "clients": "clients",
    "sites": "sites",
    "field-officers": "field_officers",
    "departments": "departments",
    "locations": "locations",
    "attendance": "attendance",
    "leave-requests": "leave_requests",
    "job-postings": "job_postings",
    "candidates": "candidates",
    "onboarding-tasks": "onboarding_tasks",
    "performance-reviews": "performance_reviews",
    "payroll": "payroll",
    "salary-structures": "salary_structures",
    "loans": "loans",
    "reimbursements": "reimbursements",
    "onboarding-templates": "onboarding_templates",
    "equipment-assignments": "equipment_assignments",
    "training-assignments": "training_assignments",
    "probation-reviews": "probation_reviews",
}


@app.get("/api/{resource}")
async def list_resource(
    resource: str,
    status_value: str | None = Query(default=None, alias="status"),
    current_user: Dict[str, Any] = Depends(require_auth),
):
    collection = CRUD_COLLECTIONS.get(resource)
    if not collection:
        raise HTTPException(404, "Resource not found")
    return await generic_list(collection, status_value)


@app.post("/api/{resource}")
async def create_resource(resource: str, payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(require_auth)):
    collection = CRUD_COLLECTIONS.get(resource)
    if not collection:
        raise HTTPException(404, "Resource not found")
    return await insert_one(collection, payload)


@app.get("/api/{resource}/{doc_id}")
async def get_resource(resource: str, doc_id: str, current_user: Dict[str, Any] = Depends(require_auth)):
    collection = CRUD_COLLECTIONS.get(resource)
    if not collection:
        raise HTTPException(404, "Resource not found")
    doc = await db[collection].find_one({"_id": parse_id(doc_id)})
    if not doc:
        raise HTTPException(404, "Record not found")
    doc["id"] = str(doc.pop("_id"))
    return doc


@app.put("/api/{resource}/{doc_id}")
async def update_resource(resource: str, doc_id: str, payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(require_auth)):
    collection = CRUD_COLLECTIONS.get(resource)
    if not collection:
        raise HTTPException(404, "Resource not found")
    updated = await update_one(collection, doc_id, payload)
    if not updated:
        raise HTTPException(404, "Record not found")
    return updated


@app.delete("/api/{resource}/{doc_id}")
async def delete_resource(resource: str, doc_id: str, current_user: Dict[str, Any] = Depends(require_auth)):
    collection = CRUD_COLLECTIONS.get(resource)
    if not collection:
        raise HTTPException(404, "Resource not found")
    result = await db[collection].delete_one({"_id": parse_id(doc_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Record not found")
    return {"message": "Deleted successfully"}


@app.post("/api/employees/bulk")
async def create_employees_bulk(payload: Dict[str, List[Dict[str, Any]]], current_user: Dict[str, Any] = Depends(require_auth)):
    employees = payload.get("employees", [])
    if not isinstance(employees, list):
        raise HTTPException(400, "employees must be a list")
    now = datetime.now(timezone.utc).isoformat()
    docs = [{**emp, "created_at": now, "updated_at": now} for emp in employees]
    if docs:
        await db["employees"].insert_many(docs)
    return {"message": f"Imported {len(docs)} employees"}


@app.put("/api/leave-requests/{leave_id}/approve")
async def approve_leave(leave_id: str, payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(require_auth)):
    payload["status"] = payload.get("status", "approved")
    updated = await update_one("leave_requests", leave_id, payload)
    if not updated:
        raise HTTPException(404, "Leave request not found")
    return updated


@app.put("/api/job-postings/{job_id}/status")
async def update_job_status(job_id: str, payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(require_auth)):
    updated = await update_one("job_postings", job_id, {"status": payload.get("status", "open")})
    if not updated:
        raise HTTPException(404, "Job posting not found")
    return updated


@app.put("/api/candidates/{candidate_id}/stage")
async def update_candidate_stage(candidate_id: str, payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(require_auth)):
    updated = await update_one("candidates", candidate_id, {"stage": payload.get("stage", "applied")})
    if not updated:
        raise HTTPException(404, "Candidate not found")
    return updated


@app.put("/api/onboarding-tasks/{task_id}/status")
async def update_task_status(task_id: str, payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(require_auth)):
    updated = await update_one("onboarding_tasks", task_id, {"status": payload.get("status", "pending")})
    if not updated:
        raise HTTPException(404, "Task not found")
    return updated


@app.put("/api/reimbursements/{reimb_id}/approve")
async def approve_reimbursement(
    reimb_id: str,
    approved_by: str = Query(default="HR Manager"),
    current_user: Dict[str, Any] = Depends(require_auth),
):
    updated = await update_one("reimbursements", reimb_id, {"status": "approved", "approved_by": approved_by})
    if not updated:
        raise HTTPException(404, "Reimbursement not found")
    return updated


def ensure_cloudinary_configured() -> None:
    if not os.getenv("CLOUDINARY_CLOUD_NAME") or not os.getenv("CLOUDINARY_API_KEY") or not os.getenv("CLOUDINARY_API_SECRET"):
        raise HTTPException(status_code=500, detail="Cloudinary is not configured")


async def upload_to_cloudinary(file: UploadFile, folder: str) -> Dict[str, Any]:
    ensure_cloudinary_configured()
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(400, "Empty file")
    result = cloudinary.uploader.upload(io.BytesIO(file_bytes), folder=folder, resource_type="auto", public_id=None)
    return result


@app.post("/api/upload")
@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    guard_id: str | None = Query(default=None),
    employee_id: str | None = Query(default=None),
    document_type: str = Query(default="general"),
    expiry_date: str | None = Query(default=None),
    notes: str | None = Query(default=""),
    current_user: Dict[str, Any] = Depends(require_auth),
):
    upload = await upload_to_cloudinary(file, "assuredhr/documents")
    doc = await insert_one(
        "documents",
        {
            "guard_id": guard_id,
            "employee_id": employee_id,
            "document_type": document_type,
            "expiry_date": expiry_date,
            "notes": notes,
            "verification_status": "pending",
            "uploaded_by": current_user.get("id"),
            "filename": file.filename,
            "url": upload.get("secure_url"),
            "public_id": upload.get("public_id"),
            "resource_type": upload.get("resource_type", "raw"),
        },
    )
    return doc


@app.post("/api/employee/documents/upload")
async def upload_employee_document(
    file: UploadFile = File(...),
    document_type: str = Form(default="general"),
    current_user: Dict[str, Any] = Depends(require_auth),
):
    upload = await upload_to_cloudinary(file, "assuredhr/employee-documents")
    return await insert_one(
        "documents",
        {
            "employee_id": current_user.get("id"),
            "document_type": document_type,
            "verification_status": "pending",
            "uploaded_by": current_user.get("id"),
            "filename": file.filename,
            "url": upload.get("secure_url"),
            "public_id": upload.get("public_id"),
            "resource_type": upload.get("resource_type", "raw"),
        },
    )


@app.get("/api/documents/{target_id}")
async def list_documents(target_id: str, current_user: Dict[str, Any] = Depends(require_auth)):
    docs = await find_many("documents", {"$or": [{"guard_id": target_id}, {"employee_id": target_id}]})
    return docs


@app.put("/api/documents/{doc_id}/verify")
async def verify_document(doc_id: str, payload: VerifyDocumentRequest, current_user: Dict[str, Any] = Depends(require_auth)):
    updated = await update_one(
        "documents",
        doc_id,
        {
            "verification_status": payload.verification_status,
            "verification_remarks": payload.remarks,
            "verified_by": current_user.get("id"),
            "verified_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    if not updated:
        raise HTTPException(404, "Document not found")
    return updated


@app.get("/api/employee/dashboard")
async def employee_dashboard(current_user: Dict[str, Any] = Depends(require_auth)):
    employee_id = current_user.get("id")
    attendance_count = await db["attendance"].count_documents({"employee_id": employee_id})
    leave_count = await db["leave_requests"].count_documents({"employee_id": employee_id})
    docs_count = await db["documents"].count_documents({"employee_id": employee_id})
    return {
        "employee": current_user,
        "attendance_records": attendance_count,
        "leave_requests": leave_count,
        "documents": docs_count,
    }


@app.get("/api/employee/profile")
async def employee_profile(current_user: Dict[str, Any] = Depends(require_auth)):
    employee = await find_one("employees", {"email": current_user.get("email")})
    return employee or current_user


@app.put("/api/employee/profile")
async def update_employee_profile(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(require_auth)):
    employee = await find_one("employees", {"email": current_user.get("email")})
    if employee:
        return await update_one("employees", employee["id"], payload)
    return payload


@app.get("/api/employee/attendance")
async def employee_attendance(current_user: Dict[str, Any] = Depends(require_auth)):
    return await find_many("attendance", {"employee_id": current_user.get("id")})


@app.get("/api/employee/leaves")
async def employee_leaves(current_user: Dict[str, Any] = Depends(require_auth)):
    return await find_many("leave_requests", {"employee_id": current_user.get("id")})


@app.post("/api/employee/leaves")
async def employee_create_leave(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(require_auth)):
    return await insert_one("leave_requests", {**payload, "employee_id": current_user.get("id"), "status": "pending"})


@app.get("/api/employee/payslips")
async def employee_payslips(current_user: Dict[str, Any] = Depends(require_auth)):
    return await find_many("payroll", {"employee_id": current_user.get("id")})


@app.get("/api/employee/documents")
async def employee_documents(current_user: Dict[str, Any] = Depends(require_auth)):
    return await find_many("documents", {"employee_id": current_user.get("id")})


@app.get("/api/documents/{doc_id}/download")
async def get_document_download(doc_id: str, current_user: Dict[str, Any] = Depends(require_auth)):
    doc = await db["documents"].find_one({"_id": parse_id(doc_id)})
    if not doc:
        raise HTTPException(404, "Document not found")
    return {"download_url": doc.get("url"), "filename": doc.get("filename")}
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
