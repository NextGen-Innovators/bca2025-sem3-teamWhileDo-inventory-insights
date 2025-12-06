from motor.motor_asyncio import AsyncIOMotorClient
from .config import MONGO_URI

client = None
db = None

async def connect_db():
    global client, db
    print("🔌 Connecting to MongoDB Atlas...")
    client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client["hackathon"]
    print("🚀 Connected to MongoDB Atlas:", "hackathon")

async def close_db():
    global client
    client.close()
    print("🛑 MongoDB Atlas connection closed")
