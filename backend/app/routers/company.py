from fastapi import APIRouter, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional, List
from app.database import get_database
from app.schemas.company import (
    CompanyCreate, 
    CompanyUpdate, 
    CompanyOut, 
    CompanyWithEmployees
)
from app.schemas.user import UserRole

router = APIRouter()

@router.post("/", response_model=CompanyOut, status_code=201)
async def create_company(company_data: CompanyCreate):
    """
    Create a new company (onboarding)
    """
    try:
        db = get_database()
        
        # Check if company with same email already exists
        existing_company = await db.companies.find_one({"email": company_data.email})
        if existing_company:
            raise HTTPException(
                status_code=400, 
                detail="Company with this email already exists"
            )
        
        # Convert Pydantic model to dict
        company_dict = company_data.model_dump()
        
        # Convert HttpUrl to string for MongoDB storage
        if company_dict.get("website"):
            company_dict["website"] = str(company_dict["website"])
        
        # Add timestamps and defaults
        company_dict.update({
            "employee_count": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        })
        
        # Insert company into database
        result = await db.companies.insert_one(company_dict)
        company_id = str(result.inserted_id)
        
        # Update user's onboarding status
        user_email = company_data.email
        user = await db.users.find_one({"email": user_email})
        
        if user:
            # Update user with company reference and mark as onboarded
            await db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "company_id": company_id,
                        "is_onboarded": True,
                        "updated_at": datetime.utcnow(),
                        # Optionally set user as admin for their company
                        "role": UserRole.ADMIN.value
                    }
                }
            )
        else:
            # Create a user entry if it doesn't exist
            user_data = {
                "name": company_data.name.split()[0] if company_data.name else "Admin",
                "email": company_data.email,
                "company_id": company_id,
                "role": UserRole.ADMIN.value,
                "is_onboarded": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.users.insert_one(user_data)
        
        # Prepare response
        response_data = company_dict.copy()
        response_data["id"] = company_id
        response_data["website"] = str(response_data["website"]) if response_data.get("website") else None
        
        print(f"✅ Company created successfully: {company_data.name} ({company_id})")
        return CompanyOut(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating company: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create company: {str(e)}"
        )

@router.get("/", response_model=List[CompanyOut])
async def get_all_companies(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=200, description="Number of records to return"),
    active_only: bool = Query(True, description="Return only active companies")
):
    """
    Get all companies with pagination
    """
    try:
        db = get_database()
        
        # Build query filter
        query_filter = {}
        if active_only:
            query_filter["is_active"] = True
        
        # Get companies with pagination
        companies = await db.companies.find(query_filter).skip(skip).limit(limit).to_list(length=limit)
        
        # Convert to response model
        result = []
        for company in companies:
            company["id"] = str(company["_id"])
            result.append(CompanyOut(**company))
        
        return result
        
    except Exception as e:
        print(f"❌ Error fetching companies: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch companies")

@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(company_id: str):
    """
    Get company by ID
    """
    try:
        db = get_database()
        
        company = await db.companies.find_one({"_id": ObjectId(company_id)})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        company["id"] = str(company["_id"])
        return CompanyOut(**company)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching company: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid company ID")

@router.get("/email/{email}", response_model=CompanyOut)
async def get_company_by_email(email: str):
    """
    Get company by email
    """
    try:
        db = get_database()
        
        company = await db.companies.find_one({"email": email})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        company["id"] = str(company["_id"])
        return CompanyOut(**company)
        
    except Exception as e:
        print(f"❌ Error fetching company by email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch company")

@router.get("/{company_id}/with-employees", response_model=CompanyWithEmployees)
async def get_company_with_employees(company_id: str):
    """
    Get company details along with its employees
    """
    try:
        db = get_database()
        
        # Get company
        company = await db.companies.find_one({"_id": ObjectId(company_id)})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Get employees for this company
        employees = await db.users.find({"company_id": company_id, "role": UserRole.EMPLOYEE.value}).to_list(100)
        
        # Prepare employee data (exclude sensitive info)
        employee_list = []
        for emp in employees:
            employee_list.append({
                "id": str(emp["_id"]),
                "name": emp.get("name"),
                "email": emp.get("email"),
                "department": emp.get("department"),
                "position": emp.get("position"),
                "is_onboarded": emp.get("is_onboarded", False)
            })
        
        # Prepare response
        company_data = company.copy()
        company_data["id"] = str(company["_id"])
        company_data["employees"] = employee_list
        company_data["employee_count"] = len(employee_list)
        
        return CompanyWithEmployees(**company_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching company with employees: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid company ID")

@router.put("/{company_id}", response_model=CompanyOut)
async def update_company(company_id: str, company_data: CompanyUpdate):
    """
    Update company information
    """
    try:
        db = get_database()
        
        # Check if company exists
        existing_company = await db.companies.find_one({"_id": ObjectId(company_id)})
        if not existing_company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Prepare update data (exclude None values)
        update_data = company_data.model_dump(exclude_unset=True)
        
        # Convert HttpUrl to string if website is updated
        if update_data.get("website"):
            update_data["website"] = str(update_data["website"])
        
        # Update timestamps
        update_data["updated_at"] = datetime.utcnow()
        
        # Perform update
        result = await db.companies.update_one(
            {"_id": ObjectId(company_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            # No changes made, return existing company
            existing_company["id"] = str(existing_company["_id"])
            return CompanyOut(**existing_company)
        
        # Fetch updated company
        updated_company = await db.companies.find_one({"_id": ObjectId(company_id)})
        updated_company["id"] = str(updated_company["_id"])
        
        print(f"✅ Company updated successfully: {company_id}")
        return CompanyOut(**updated_company)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating company: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid company ID")

@router.patch("/{company_id}/employee-count")
async def update_employee_count(company_id: str):
    """
    Update employee count for a company
    """
    try:
        db = get_database()
        
        # Count employees for this company
        employee_count = await db.users.count_documents({
            "company_id": company_id,
            "role": UserRole.EMPLOYEE.value
        })
        
        # Update company with new count
        await db.companies.update_one(
            {"_id": ObjectId(company_id)},
            {
                "$set": {
                    "employee_count": employee_count,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "message": "Employee count updated successfully",
            "company_id": company_id,
            "employee_count": employee_count
        }
        
    except Exception as e:
        print(f"❌ Error updating employee count: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid company ID")

@router.delete("/{company_id}")
async def delete_company(company_id: str, hard_delete: bool = Query(False, description="Permanently delete company")):
    """
    Delete (deactivate) a company
    """
    try:
        db = get_database()
        
        # Check if company exists
        company = await db.companies.find_one({"_id": ObjectId(company_id)})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        if hard_delete:
            # Permanently delete company (and associated users if needed)
            await db.companies.delete_one({"_id": ObjectId(company_id)})
            message = "Company permanently deleted"
        else:
            # Soft delete - mark as inactive
            await db.companies.update_one(
                {"_id": ObjectId(company_id)},
                {
                    "$set": {
                        "is_active": False,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            message = "Company deactivated successfully"
        
        print(f"✅ Company {'deleted' if hard_delete else 'deactivated'}: {company_id}")
        return {"message": message, "company_id": company_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting company: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid company ID")

@router.get("/user/{user_email}", response_model=CompanyOut)
async def get_user_company(user_email: str):
    """
    Get company for a specific user
    """
    try:
        db = get_database()
        
        # Find user
        user = await db.users.find_one({"email": user_email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's company ID
        company_id = user.get("company_id")
        if not company_id:
            raise HTTPException(status_code=404, detail="User is not associated with any company")
        
        # Get company
        company = await db.companies.find_one({"_id": ObjectId(company_id)})
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        company["id"] = str(company["_id"])
        return CompanyOut(**company)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching user's company: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch company")