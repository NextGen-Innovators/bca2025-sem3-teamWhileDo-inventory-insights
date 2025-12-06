from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List
from datetime import datetime

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
    postal_code: Optional[str] = None
    founded_year: Optional[int] = None
    company_size: Optional[str] = None  # e.g., "1-10", "11-50", "51-200", etc.
    
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
    postal_code: Optional[str] = None
    founded_year: Optional[int] = None
    company_size: Optional[str] = None

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
    postal_code: Optional[str] = None
    founded_year: Optional[int] = None
    company_size: Optional[str] = None
    employee_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

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
    postal_code: Optional[str] = None
    founded_year: Optional[int] = None
    company_size: Optional[str] = None
    employee_count: Optional[int] = 0
    employees: Optional[List[dict]] = []  # List of employee objects
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True