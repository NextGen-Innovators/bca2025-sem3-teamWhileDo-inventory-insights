from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from app.database import get_database
from app.schemas.company import UserRole
from app.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS

router = APIRouter()

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class EmployeeLoginRequest(BaseModel):
    email: EmailStr
    password: str


class EmployeeLoginResponse(BaseModel):
    access_token: str
    token_type: str
    employee: dict


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(employee_id: str, email: str, name: str, expires_delta: timedelta = None) -> str:
    """Create a JWT access token"""
    if expires_delta is None:
        expires_delta = timedelta(hours=JWT_EXPIRATION_HOURS)
    
    expire = datetime.utcnow() + expires_delta
    
    payload = {
        "employee_id": employee_id,
        "email": email,
        "name": name,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    encoded_jwt = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


@router.post("/employee-login", response_model=EmployeeLoginResponse)
async def employee_login(credentials: EmployeeLoginRequest):
    """
    Employee login endpoint.
    Returns JWT token and employee details.
    
    Note: Password should be hashed in the database for security.
    """
    try:
        db = get_database()
        
        # Find employee by email
        employee = await db.users.find_one({
            "email": credentials.email,
            "role": UserRole.EMPLOYEE.value
        })
        
        if not employee:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or credentials"
            )
        
        # Check if password exists and verify it
        stored_password = employee.get("password")
        if not stored_password:
            # If no password set, reject login
            raise HTTPException(
                status_code=401,
                detail="Invalid email or credentials"
            )
        
        # Verify password
        if not verify_password(credentials.password, stored_password):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or credentials"
            )
        
        # Create access token
        employee_id = str(employee["_id"])
        access_token = create_access_token(
            employee_id=employee_id,
            email=employee["email"],
            name=employee["name"]
        )
        
        # Prepare employee response data
        employee_response = {
            "id": employee_id,
            "name": employee.get("name"),
            "email": employee.get("email"),
            "department": employee.get("department"),
            "position": employee.get("position"),
            "company_id": employee.get("company_id"),
            "skills": employee.get("skills", []),
            "tags": employee.get("tags", []),
            "is_onboarded": employee.get("is_onboarded", False),
            "current_load": employee.get("current_load", 0),
            "max_capacity": employee.get("max_capacity", 10),
            "role": employee.get("role")
        }
        
        print(f"✅ Employee logged in: {credentials.email}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "employee": employee_response
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error during employee login: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")



@router.get("/me")
async def get_current_employee(authorization: str = None):
    """
    Get current logged-in employee details from JWT token.
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Missing or invalid authorization header"
            )
        
        token = authorization.replace("Bearer ", "")
        
        # Decode JWT
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        employee_id = payload.get("employee_id")
        email = payload.get("email")
        
        if not employee_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )
        
        db = get_database()
        from bson import ObjectId
        
        # Fetch employee from database
        employee = await db.users.find_one({"_id": ObjectId(employee_id)})
        if not employee:
            raise HTTPException(
                status_code=404,
                detail="Employee not found"
            )
        
        return {
            "id": str(employee["_id"]),
            "name": employee.get("name"),
            "email": employee.get("email"),
            "department": employee.get("department"),
            "position": employee.get("position"),
            "company_id": employee.get("company_id"),
            "skills": employee.get("skills", []),
            "tags": employee.get("tags", []),
            "is_onboarded": employee.get("is_onboarded", False),
            "current_load": employee.get("current_load", 0),
            "max_capacity": employee.get("max_capacity", 10),
            "role": employee.get("role")
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching current employee: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch employee details")
