from pydantic import BaseModel, EmailStr
from typing import Optional, Literal, List
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    USER = "user"
    EMPLOYEE = "employee"

class UserInfo(BaseModel):
    id: str
    name: str
    email: EmailStr

class TokenSave(BaseModel):
    access_token: str
    refresh_token: str
    user: UserInfo

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    access_token: str
    refresh_token: str
    google_id: Optional[str] = None
    role: UserRole = UserRole.USER

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    role: Literal[UserRole.EMPLOYEE] = UserRole.EMPLOYEE
    department: Optional[str] = None
    position: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[int] = None
    bio: Optional[str] = None
    company_id: Optional[str] = None
    phone: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[datetime] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    position: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[int] = None
    bio: Optional[str] = None
    company_id: Optional[str] = None
    phone: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[datetime] = None

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    google_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class EmployeeOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Literal[UserRole.EMPLOYEE]
    department: Optional[str] = None
    position: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[int] = None
    bio: Optional[str] = None
    company_id: Optional[str] = None
    phone: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class EmployeeWithCompany(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Literal[UserRole.EMPLOYEE]
    department: Optional[str] = None
    position: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[int] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[datetime] = None
    company: Optional[dict] = None 
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True