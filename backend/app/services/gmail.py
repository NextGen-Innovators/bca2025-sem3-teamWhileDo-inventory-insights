from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from fastapi import HTTPException
from bson import ObjectId
from datetime import datetime
from app.database import get_database
import os

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send"
]

async def get_user_credentials(access_token: str = None):
    """
    Get Gmail credentials for a user from MongoDB
    Can search by access_token
    """
    try:
        db = get_database()
        
        if access_token:
            user = await db.users.find_one({"access_token": access_token})
        else:
            raise HTTPException(status_code=400, detail="access_token is required")
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.get("access_token"):
            raise HTTPException(
                status_code=401, 
                detail="User has not authorized Gmail access. Please login first."
            )
        
        creds = Credentials(
            token=user["access_token"],
            refresh_token=user.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=SCOPES,
        )
        
        if creds.expired and creds.refresh_token:
            print(f"🔄 Refreshing token for user: {user['email']}")
            creds.refresh(Request())
            
            await db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "access_token": creds.token,
                        "refresh_token": creds.refresh_token,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            print(f"✅ Token refreshed and saved for user: {user['email']}")
        
        return creds, user
    
    except Exception as e:
        print(f"❌ Error getting credentials: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get credentials: {str(e)}")

async def get_gmail_service(access_token: str = None):
    """
    Get authenticated Gmail service for a user
    """
    creds, user = await get_user_credentials(access_token=access_token)
    service = build("gmail", "v1", credentials=creds)
    return service, user