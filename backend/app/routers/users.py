from fastapi import APIRouter, HTTPException
from bson import ObjectId
from app.database import db
from app.schemas.user import UserCreate, UserOut

router = APIRouter()

@router.post("/", response_model=UserOut)
async def create_user(data: UserCreate):
    user = data.model_dump()
    result = await db.users.insert_one(user)
    
    return UserOut(
        id=str(result.inserted_id),
        **user
    )

@router.get("/", response_model=list[UserOut])
async def get_users():
    users = await db.users.find().to_list(200)
    return [UserOut(id=str(u["_id"]), **u) for u in users]
