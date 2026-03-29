from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# Auth
class SignupRequest(BaseModel):
    company_name: str
    email: str
    password: str
    country: str
    currency: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    must_change_password: bool
    user_name: str


# User
class CreateApproverRequest(BaseModel):
    name: str
    email: str
    password: str
    approver_designation: str


class CreateEmployeeRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "employee"
    manager_id: Optional[int] = None
    is_manager_approver: bool = False
    approver_mappings: Optional[List[dict]] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_approver: bool
    approver_designation: Optional[str]
    manager_id: Optional[int]
    is_manager_approver: bool

    class Config:
        from_attributes = True


# Settings
class SMTPSettingsRequest(BaseModel):
    admin_email: str
    admin_app_password: str


# Expense
class ExpenseLineCreate(BaseModel):
    item_name: str
    quantity: int = 1
    unit_price: float


class ExpenseCreate(BaseModel):
    amount: float
    currency: str
    category: str
    description: Optional[str] = None
    vendor_name: Optional[str] = None
    date: str
    expense_lines: Optional[List[ExpenseLineCreate]] = None


class ExpenseResponse(BaseModel):
    id: int
    amount: float
    currency: str
    converted_amount: Optional[float]
    category: str
    description: Optional[str]
    vendor_name: Optional[str]
    date: str
    status: str
    current_step: int
    receipt_image_path: Optional[str]
    ocr_raw_data: Optional[dict]
    ocr_match_status: Optional[bool]
    created_at: datetime
    user_name: Optional[str] = None
    approval_trail: Optional[List[dict]] = None

    class Config:
        from_attributes = True


# Approval
class ApprovalActionRequest(BaseModel):
    comment: str


class ApprovalFlowStepCreate(BaseModel):
    step_order: int
    approver_designation: str
    is_manager_step: bool = False


class ApprovalFlowTemplateCreate(BaseModel):
    steps: List[ApprovalFlowStepCreate]


class ApprovalRuleCreate(BaseModel):
    rule_type: str
    threshold_percentage: Optional[float] = None
    specific_approver_id: Optional[int] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    category: Optional[str] = None