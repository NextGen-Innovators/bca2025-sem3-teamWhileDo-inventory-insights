from pydantic import BaseModel, EmailStr, HttpUrl, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# User Role Enum
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    EMPLOYEE = "employee"

# Company Schemas
class CompanyCreate(BaseModel):
    name: str
    email: EmailStr
    description: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[HttpUrl] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    user_id: str
    
class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[HttpUrl] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    is_active: Optional[bool] = None
    

class CompanyOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    description: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    employee_count: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    user_id: str
    
    
    class Config:
        from_attributes = True

class EmployeeBasic(BaseModel):
    id: str
    name: str
    email: EmailStr
    department: Optional[str] = None
    position: Optional[str] = None
    is_onboarded: bool = False

class CompanyWithEmployees(BaseModel):
    id: str
    name: str
    email: EmailStr
    description: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    employee_count: int = 0
    is_active: bool = True
    employees: List[EmployeeBasic] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# User Schemas
class GoogleUser(BaseModel):
    id: str
    name: str
    email: EmailStr
    image: Optional[str] = None

class TokenSave(BaseModel):
    access_token: str
    refresh_token: str
    user: GoogleUser

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.USER
    is_onboarded: bool = False

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    is_onboarded: bool
    company_id: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    department: Optional[str] = None
    position: Optional[str] = None
    company_id: str

class EmployeeOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    department: Optional[str] = None
    position: Optional[str] = None
    company_id: str
    is_onboarded: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None