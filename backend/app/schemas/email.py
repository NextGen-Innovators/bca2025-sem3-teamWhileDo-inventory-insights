from pydantic import BaseModel

class EmailCreate(BaseModel):
    sender: str
    subject: str
    body: str
    emailid: str

class EmailOut(BaseModel):
    id: str
    sender: str
    subject: str
    body: str
    emailid: str