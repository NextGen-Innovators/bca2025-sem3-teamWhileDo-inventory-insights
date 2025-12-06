from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os

client: Optional[AsyncIOMotorClient] = None
db = None

async def connect_db():
    global client, db
    try:
        print("🔌 Connecting to MongoDB Atlas...")
        
        # Get MongoDB URI from environment variable
        MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        DATABASE_NAME = os.getenv("DATABASE_NAME", "hackathon")
        
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        
        # Test the connection
        await client.admin.command('ping')
        
        print(f"🚀 Connected to MongoDB Atlas: {DATABASE_NAME}")
        return db
    except Exception as e:
        print(f"Failed to connect to MongoDB: {str(e)}")
        raise

async def close_db():
    global client
    if client:
        print("👋 Closing MongoDB connection...")
        client.close()
        print(" MongoDB connection closed")

def get_database():
    """Get the database instance"""
    if db is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return db