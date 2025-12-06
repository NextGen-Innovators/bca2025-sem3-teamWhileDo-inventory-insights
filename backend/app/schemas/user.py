from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    age: int
    access_token: str
    refresh_token: str
    email: str
    

class UserOut(BaseModel):
    id: str
    name: str
    age: int
