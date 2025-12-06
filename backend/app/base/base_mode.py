from pydantic import BaseModel
from typing import Literal

class email(BaseModel):
    sender:str
    subject:str
    body:str


class classification(email):
    type: Literal['inquiry', 'ticket']


class categorization(email):
    category: str
    assigee:str
    priority:str
    problem:str
        


class inquiry_response(email):
    type: Literal['inquiry']
    sender:str
    subject:str
    body:str


class ticket_response(email):
    type: Literal['ticket']
    sender:str
    subject:str
    body:str
