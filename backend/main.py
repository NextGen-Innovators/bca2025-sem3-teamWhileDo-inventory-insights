from fastapi import FastAPI
from app.database import connect_db, close_db
from app.routers import users, emails

app = FastAPI()

# ==== DB Events ====
@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await close_db()

# ==== Routers ====
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(emails.router, prefix="/emails", tags=["Emails"])

@app.get("/")
async def root():
    return {"message": "API running"}
