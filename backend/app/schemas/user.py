from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    EMPLOYEE = "employee"

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

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    department: Optional[str] = None
    position: Optional[str] = None

class EmployeeOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    department: Optional[str] = None
    position: Optional[str] = None