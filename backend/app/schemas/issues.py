from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List
from datetime import datetime
from enum import Enum


class IssueSource(str, Enum):
    EMAIL = "email"
    FORM = "form"
    API = "api"


# Ticket state
class IssueStatus(str, Enum):
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    SPAM = "spam"


class IssuePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class IssueCreate(BaseModel):
    company_id: str
    subject: str
    message: str
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None

    category: Optional[str] = None 
    priority: IssuePriority = IssuePriority.MEDIUM

    attachments: Optional[List[HttpUrl]] = []
    source: IssueSource = IssueSource.EMAIL
    assigned_to:str
    emailId:Optional[str] = None


class IssueUpdate(BaseModel):
    subject: Optional[str] = None
    message: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[IssuePriority] = None
    status: Optional[IssueStatus] = None
    attachments: Optional[List[HttpUrl]] = None
    assigned_to:str
    


class IssueOut(BaseModel):
    id: str
    company_id: str
    subject: str
    message: str
    from_email: Optional[EmailStr]
    from_name: Optional[str]

    category: Optional[str]
    priority: IssuePriority
    status: IssueStatus = IssueStatus.OPEN

    attachments: List[str] = []
    source: IssueSource
    assigned_to:str

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
