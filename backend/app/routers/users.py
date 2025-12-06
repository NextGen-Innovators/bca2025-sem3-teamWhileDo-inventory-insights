from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.database import db
from app.schemas.user import (
    UserCreate, UserOut, TokenSave, 
    EmployeeCreate, EmployeeOut, UserRole
)

router = APIRouter()

@router.post("/save-token")
async def save_token(data: TokenSave):
    try:
        existing_user = await db.users.find_one({"email": data.user.email})
        
        if existing_user:
            await db.users.update_one(
                {"email": data.user.email},
                {
                    "$set": {
                        "access_token": data.access_token,
                        "refresh_token": data.refresh_token,
                        "name": data.user.name,
                        "google_id": data.user.id,
                    }
                }
            )
            user_id = str(existing_user["_id"])
        else:
            user_doc = {
                "name": data.user.name,
                "email": data.user.email,
                "google_id": data.user.id,
                "access_token": data.access_token,
                "refresh_token": data.refresh_token,
                "role": UserRole.USER,
            }
            result = await db.users.insert_one(user_doc)
            user_id = str(result.inserted_id)
        
        return {
            "message": "Token saved successfully",
            "user_id": user_id,
            "email": data.user.email
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save token: {str(e)}")

@router.post("/users", response_model=UserOut)
async def create_user(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    user = data.model_dump()
    result = await db.users.insert_one(user)
    
    return UserOut(
        id=str(result.inserted_id),
        name=user["name"],
        email=user["email"],
        role=user["role"]
    )

@router.post("/employees", response_model=EmployeeOut)
async def create_employee(data: EmployeeCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    employee = data.model_dump()
    result = await db.users.insert_one(employee)
    
    return EmployeeOut(
        id=str(result.inserted_id),
        name=employee["name"],
        email=employee["email"],
        role=employee["role"],
        department=employee.get("department"),
        position=employee.get("position")
    )

@router.get("/users", response_model=list[UserOut])
async def get_all_users():
    users = await db.users.find().to_list(200)
    return [
        UserOut(
            id=str(u["_id"]),
            name=u["name"],
            email=u["email"],
            role=u.get("role", UserRole.USER)
        ) 
        for u in users
    ]

@router.get("/users/role/{role}", response_model=list[UserOut])
async def get_users_by_role(role: UserRole):
    """Get users filtered by role"""
    users = await db.users.find({"role": role}).to_list(200)
    return [
        UserOut(
            id=str(u["_id"]),
            name=u["name"],
            email=u["email"],
            role=u["role"]
        ) 
        for u in users
    ]

@router.get("/employees", response_model=list[EmployeeOut])
async def get_all_employees():
    employees = await db.users.find({"role": UserRole.EMPLOYEE}).to_list(200)
    return [
        EmployeeOut(
            id=str(e["_id"]),
            name=e["name"],
            email=e["email"],
            role=e["role"],
            department=e.get("department"),
            position=e.get("position")
        ) 
        for e in employees
    ]

@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserOut(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            role=user.get("role", UserRole.USER)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid user ID")

@router.get("/users/email/{email}", response_model=UserOut)
async def get_user_by_email(email: str):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserOut(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user.get("role", UserRole.USER)
    )

@router.patch("/users/{user_id}/role")
async def update_user_role(user_id: str, role: UserRole):
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": role}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User role updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid user ID")

@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    try:
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid user ID")