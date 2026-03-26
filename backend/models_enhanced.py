from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

# ============ ORGANIZATIONAL STRUCTURE MODELS ============

class DepartmentCreate(BaseModel):
    name: str
    code: str
    head_employee_id: Optional[str] = None
    description: Optional[str] = None
    cost_center: Optional[str] = None

class Department(DepartmentCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LocationCreate(BaseModel):
    name: str
    code: str
    address: str
    city: str
    state: str
    country: str
    is_head_office: bool = False

class Location(LocationCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DesignationCreate(BaseModel):
    title: str
    level: int  # 1=Entry, 2=Mid, 3=Senior, 4=Lead, 5=Manager, 6=Director
    department_id: str
    reports_to_designation_id: Optional[str] = None

class Designation(DesignationCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EmployeeTransferCreate(BaseModel):
    employee_id: str
    from_department: str
    to_department: str
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    from_designation: Optional[str] = None
    to_designation: Optional[str] = None
    effective_date: str
    reason: str
    approved_by: str

class EmployeeTransfer(EmployeeTransferCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "pending"  # pending, approved, rejected
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ PAYROLL ENHANCED MODELS ============

class SalaryComponentCreate(BaseModel):
    component_name: str
    component_type: str  # earning, deduction, statutory
    calculation_type: str  # fixed, percentage
    value: float
    is_taxable: bool = True
    is_part_of_ctc: bool = True

class SalaryComponent(SalaryComponentCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class SalaryStructureCreate(BaseModel):
    employee_id: str
    ctc_annual: float
    basic_salary: float
    hra: float
    special_allowance: float
    other_allowances: float
    pf_employee: float
    pf_employer: float
    esi_employee: float
    esi_employer: float
    professional_tax: float
    effective_date: str

class SalaryStructure(SalaryStructureCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LoanAdvanceCreate(BaseModel):
    employee_id: str
    loan_type: str  # personal_loan, advance, emergency
    amount: float
    emi_amount: float
    tenure_months: int
    start_date: str
    reason: str

class LoanAdvance(LoanAdvanceCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    balance_amount: float
    status: str = "active"  # active, closed
    approved_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReimbursementCreate(BaseModel):
    employee_id: str
    reimbursement_type: str  # medical, travel, internet, mobile
    amount: float
    expense_date: str
    description: str
    receipt_document_id: Optional[str] = None

class Reimbursement(ReimbursementCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "pending"  # pending, approved, rejected, paid
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    payment_date: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InvestmentDeclarationCreate(BaseModel):
    employee_id: str
    financial_year: str
    section_80c: float = 0
    section_80d: float = 0
    hra_rent_paid: float = 0
    home_loan_interest: float = 0
    other_deductions: float = 0

class InvestmentDeclaration(InvestmentDeclarationCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "draft"  # draft, submitted, approved
    submitted_at: Optional[str] = None
    approved_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ ONBOARDING ENHANCED MODELS ============

class OnboardingTemplateCreate(BaseModel):
    template_name: str
    department: str
    role: str
    tasks: List[dict]  # [{"title": "", "description": "", "due_days": 7, "assigned_to": ""}]

class OnboardingTemplate(OnboardingTemplateCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EquipmentAssignmentCreate(BaseModel):
    employee_id: str
    equipment_type: str  # laptop, phone, access_card, id_card
    equipment_id: str
    brand_model: Optional[str] = None
    serial_number: Optional[str] = None
    assigned_date: str
    return_date: Optional[str] = None

class EquipmentAssignment(EquipmentAssignmentCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "assigned"  # assigned, returned, damaged, lost
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProbationReviewCreate(BaseModel):
    employee_id: str
    review_date: str
    reviewer_id: str
    performance_rating: float  # 1-5
    attendance_rating: float
    behavior_rating: float
    strengths: str
    areas_of_improvement: str
    recommendation: str  # confirm, extend, terminate

class ProbationReview(ProbationReviewCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "draft"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TrainingModuleCreate(BaseModel):
    module_name: str
    description: str
    duration_hours: float
    trainer: str
    is_mandatory: bool = False

class TrainingModule(TrainingModuleCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TrainingAssignmentCreate(BaseModel):
    employee_id: str
    training_module_id: str
    assigned_date: str
    due_date: str

class TrainingAssignment(TrainingAssignmentCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "assigned"  # assigned, in_progress, completed
    completion_date: Optional[str] = None
    score: Optional[float] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ SECURITY GUARD MANAGEMENT MODELS ============

class GuardCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    address: str
    photo_url: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    assigned_site_id: Optional[str] = None
    field_officer_id: Optional[str] = None
    shift: str = "day"  # day, night, rotating
    salary_type: str = "daily"  # daily, monthly
    rate_per_day: float = 0
    basic_salary: float = 0  # For PF/ESI calculation
    joining_date: str
    verification_status: str = "pending"  # pending, verified, rejected
    status: str = "active"  # active, inactive

class Guard(GuardCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_completion_percentage: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ClientCreate(BaseModel):
    name: str
    company: str
    address: str
    gst_number: Optional[str] = None
    contact_person: str
    contact_phone: str
    contact_email: str

class Client(ClientCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "active"  # active, inactive
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SiteCreate(BaseModel):
    name: str
    client_id: str
    location: str
    address: str
    guards_required: int
    billing_rate_per_guard: float
    shift_type: str = "day"  # day, night, rotating, 24x7
    assigned_field_officer_id: Optional[str] = None

class Site(SiteCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "active"  # active, inactive
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DocumentCreate(BaseModel):
    guard_id: str
    document_type: str  # aadhaar, pan, police_verification, security_license, medical_certificate, training_certificate
    file_name: str
    firebase_url: str
    firebase_path: str  # Full path in Firebase Storage
    expiry_date: Optional[str] = None
    verification_status: str = "pending"  # pending, verified, rejected
    uploaded_by: str  # User ID who uploaded
    version: int = 1
    notes: Optional[str] = None

class Document(DocumentCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    uploaded_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FieldOfficerCreate(BaseModel):
    user_id: str  # Reference to admin_users collection
    name: str
    email: str
    phone: str
    assigned_guards: List[str] = []  # List of guard IDs
    assigned_sites: List[str] = []  # List of site IDs

class FieldOfficer(FieldOfficerCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "active"  # active, inactive
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AuditLogCreate(BaseModel):
    user_id: str
    user_name: str
    action_type: str  # created, updated, deleted, verified, uploaded
    entity_type: str  # guard, client, site, document, field_officer
    entity_id: str
    details: Optional[dict] = None

class AuditLog(AuditLogCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ FUTURE PHASE 2 MODELS (STRUCTURE READY) ============

class AttendanceLogCreate(BaseModel):
    guard_id: str
    site_id: str
    date: str
    shift: str  # day, night
    status: str  # present, absent, half_day, late
    marked_by: str  # Field officer or admin user ID
    notes: Optional[str] = None

class AttendanceLog(AttendanceLogCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DailySalaryLogCreate(BaseModel):
    guard_id: str
    date: str
    attendance_status: str  # present, absent, half_day
    rate_per_day: float
    earned_amount: float  # Calculated based on attendance
    month: str  # YYYY-MM format

class DailySalaryLog(DailySalaryLogCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InvoiceCreate(BaseModel):
    invoice_number: str
    client_id: str
    site_id: str
    month: str  # YYYY-MM format
    guards_deployed: int
    days_worked: int
    rate_per_guard: float
    subtotal: float
    gst_percentage: float = 18.0
    gst_amount: float
    total_amount: float
    status: str = "draft"  # draft, sent, paid
    generated_by: str

class Invoice(InvoiceCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sent_at: Optional[str] = None
    paid_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============ ADVANCES & DEDUCTIONS MODELS ============

class AdvanceCreate(BaseModel):
    guard_id: str
    amount: float
    date: str
    reason: str
    approved_by: str
    notes: Optional[str] = None

class Advance(AdvanceCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "approved"  # approved, pending, rejected
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DeductionCreate(BaseModel):
    guard_id: str
    amount: float
    date: str
    deduction_type: str  # penalty, loan_repayment, damage, uniform, other
    reason: str
    deducted_by: str
    notes: Optional[str] = None

class Deduction(DeductionCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SalaryAdjustmentCreate(BaseModel):
    guard_id: str
    month: str  # YYYY-MM format
    adjustment_type: str  # bonus, penalty, overtime, other
    amount: float
    reason: str
    adjusted_by: str
    notes: Optional[str] = None

class SalaryAdjustment(SalaryAdjustmentCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
