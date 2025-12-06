from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_db, close_db
from app.routers import users
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(title="User Management API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await close_db()

# Include routers
app.include_router(users.router, prefix="/users", tags=["Users"])

# Import and include Gmail router
from app.routers import gmail
app.include_router(gmail.router, prefix="/gmail", tags=["Gmail"])

@app.get("/")
async def root():
    return {"message": "API running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}