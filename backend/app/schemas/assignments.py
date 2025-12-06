from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class AssignmentSource(str, Enum):
    EMAIL = "email"
    FORM = "form"
    MANUAL = "manual"
    AUTO = "auto"


class AssignmentStatus(str, Enum):
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REASSIGNED = "reassigned"
    CANCELLED = "cancelled"


class AssignmentCreate(BaseModel):
    employee_id: str          # Who received the task
    company_id: str           # Company context
    issue_id: Optional[str] = None  # If you store issues separately
    subject: str              # Email subject or form title
    message: str              # Main content
    category: Optional[str] = None  # AI detected (billing, tech, spam, etc.)
    priority: Optional[str] = "medium"
    source: AssignmentSource = AssignmentSource.AUTO


class AssignmentUpdate(BaseModel):
    employee_id: Optional[str] = None
    status: Optional[AssignmentStatus] = None
    priority: Optional[str] = None
    category: Optional[str] = None


class AssignmentOut(BaseModel):
    id: str
    employee_id: str
    company_id: str
    issue_id: Optional[str] = None
    subject: str
    message: str
    category: Optional[str] = None
    priority: Optional[str] = None
    status: AssignmentStatus = AssignmentStatus.ASSIGNED
    source: AssignmentSource
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
