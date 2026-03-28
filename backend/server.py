import os
from pathlib import Path
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from bson import ObjectId
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from auth import authenticate_user, create_access_token, register_user, require_auth
from db import db, find_many, find_one, insert_one, update_one
from models import AuthResponse, LoginRequest, MessageResponse, RegisterRequest, VerifyDocumentRequest

app = FastAPI(title="AssuredHR Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LOCAL_STORAGE_ROOT = Path(os.getenv("LOCAL_STORAGE_ROOT", Path(__file__).resolve().parent / "storage"))
LOCAL_UPLOADS_DIR = LOCAL_STORAGE_ROOT / "uploads"
LOCAL_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(LOCAL_STORAGE_ROOT)), name="static")


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
    open_positions = await db["job_postings"].count_documents({"status": "open"})
    pending_onboarding_tasks = await db["onboarding_tasks"].count_documents({"status": "pending"})
    return {
        "total_employees": employees,
        "total_guards": guards,
        "total_sites": sites,
        "total_clients": clients,
        "pending_leaves": pending_leaves,
        "open_positions": open_positions,
        "pending_onboarding_tasks": pending_onboarding_tasks,
    }


@app.get("/api/dashboard/trends")
async def dashboard_trends(
    period: str = Query(default="week"),
    start_date: str = Query(default=None),
    end_date: str = Query(default=None),
    current_user: Dict[str, Any] = Depends(require_auth),
):
    now = datetime.now(timezone.utc)

    if period == "day":
        num_points = 24
        delta = timedelta(hours=1)
        fmt = "%H:00"
    elif period == "month":
        num_points = 30
        delta = timedelta(days=1)
        fmt = "%d %b"
    elif period == "custom" and start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
            end = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
            num_points = min((end - start).days + 1, 60)
            delta = timedelta(days=1)
            fmt = "%d %b"
        except Exception:
            num_points = 7
            delta = timedelta(days=1)
            fmt = "%d %b"
    else:
        num_points = 7
        delta = timedelta(days=1)
        fmt = "%a"

    total_employees = await db["employees"].count_documents({})
    pending_leaves = await db["leave_requests"].count_documents({"status": "pending"})
    open_positions = await db["job_postings"].count_documents({"status": "open"})
    pending_onboarding = await db["onboarding_tasks"].count_documents({"status": "pending"})

    def make_series(base_value, num_points, delta, fmt, now):
        return [
            {"time": (now - delta * (num_points - 1 - i)).strftime(fmt), "value": base_value}
            for i in range(num_points)
        ]

    return {
        "trends": {
            "total_employees": make_series(total_employees, num_points, delta, fmt, now),
            "pending_leaves": make_series(pending_leaves, num_points, delta, fmt, now),
            "open_positions": make_series(open_positions, num_points, delta, fmt, now),
            "pending_onboarding_tasks": make_series(pending_onboarding, num_points, delta, fmt, now),
        },
        "changes": {
            "total_employees": 0,
            "pending_leaves": 0,
            "open_positions": 0,
            "pending_onboarding_tasks": 0,
        },
    }


@app.get("/api/admin/users")
async def list_admin_users(current_user: Dict[str, Any] = Depends(require_auth)):
    users = await find_many("users")
    for user in users:
        user.pop("password_hash", None)
    return users


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
    if collection == "attendance":
        employee_id = payload.get("employee_id") or payload.get("guard_id")
        date_value = payload.get("date")
        if not employee_id or not date_value:
            raise HTTPException(400, "employee_id (or guard_id) and date are required for attendance")
        payload["employee_id"] = employee_id
        existing = await db["attendance"].find_one({"employee_id": employee_id, "date": date_value})
        if existing:
            updated_payload = {**payload, "marked_by": current_user.get("id")}
            return await update_one("attendance", str(existing["_id"]), updated_payload)
        payload["marked_by"] = current_user.get("id")
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
    return None


async def upload_to_cloudinary(file: UploadFile, folder: str) -> Dict[str, Any]:
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(400, "Empty file")
    safe_folder = folder.replace("\\", "/").strip("/").replace("..", "")
    target_dir = LOCAL_UPLOADS_DIR / safe_folder
    target_dir.mkdir(parents=True, exist_ok=True)
    original_ext = Path(file.filename or "").suffix
    generated_name = f"{uuid4().hex}{original_ext}"
    target_path = target_dir / generated_name
    with target_path.open("wb") as local_file:
        local_file.write(file_bytes)
    relative_path = target_path.relative_to(LOCAL_STORAGE_ROOT).as_posix()
    return {
        "secure_url": f"/static/{relative_path}",
        "public_id": relative_path,
        "resource_type": "raw",
        "file_path": str(target_path),
    }


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
    return await insert_one(
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
            "file_url": upload.get("secure_url"),
            "file_path": upload.get("file_path"),
            "public_id": upload.get("public_id"),
            "resource_type": upload.get("resource_type", "raw"),
        },
    )


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
            "file_url": upload.get("secure_url"),
            "file_path": upload.get("file_path"),
            "public_id": upload.get("public_id"),
            "resource_type": upload.get("resource_type", "raw"),
        },
    )


@app.get("/api/documents/{target_id}")
async def list_documents(target_id: str, current_user: Dict[str, Any] = Depends(require_auth)):
    return await find_many("documents", {"$or": [{"guard_id": target_id}, {"employee_id": target_id}]})


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
    return {
        "employee": current_user,
        "attendance_records": await db["attendance"].count_documents({"employee_id": employee_id}),
        "leave_requests": await db["leave_requests"].count_documents({"employee_id": employee_id}),
        "documents": await db["documents"].count_documents({"employee_id": employee_id}),
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


@app.post("/api/attendance/mark-bulk")
async def mark_attendance_bulk(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(require_auth)):
    date_value = payload.get("date")
    records = payload.get("records", [])
    if not date_value:
        raise HTTPException(400, "date is required")
    if not isinstance(records, list):
        raise HTTPException(400, "records must be a list")

    marked = 0
    for record in records:
        employee_id = record.get("employee_id") or record.get("guard_id")
        if not employee_id:
            continue
        attendance_payload = {
            "employee_id": employee_id,
            "guard_id": record.get("guard_id"),
            "date": date_value,
            "status": record.get("status", "present"),
            "check_in": record.get("check_in"),
            "check_out": record.get("check_out"),
            "notes": record.get("notes", "Bulk marked"),
            "marked_by": current_user.get("id"),
        }
        existing = await db["attendance"].find_one({"employee_id": employee_id, "date": date_value})
        if existing:
            await update_one("attendance", str(existing["_id"]), attendance_payload)
        else:
            await insert_one("attendance", attendance_payload)
        marked += 1

    return {"message": f"Attendance marked for {marked} employees", "date": date_value, "count": marked}


@app.post("/api/attendance/mark-all-present")
async def mark_all_present(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(require_auth)):
    date_value = payload.get("date")
    target = payload.get("target", "guards")
    if not date_value:
        raise HTTPException(400, "date is required")
    if target not in {"guards", "employees"}:
        raise HTTPException(400, "target must be either guards or employees")

    collection_name = "guards" if target == "guards" else "employees"
    people = await find_many(collection_name, {"status": {"$ne": "inactive"}})
    records = []
    for person in people:
        record = {"employee_id": person["id"], "status": "present", "notes": "Marked all present"}
        if target == "guards":
            record["guard_id"] = person["id"]
        records.append(record)
    return await mark_attendance_bulk({"date": date_value, "records": records}, current_user)


@app.get("/api/documents/{doc_id}/download")
async def get_document_download(doc_id: str, current_user: Dict[str, Any] = Depends(require_auth)):
    doc = await db["documents"].find_one({"_id": parse_id(doc_id)})
    if not doc:
        raise HTTPException(404, "Document not found")
    return {"download_url": doc.get("url"), "filename": doc.get("filename")}
