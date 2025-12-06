import os

# Use your MongoDB Atlas connection string
MONGO_URI = os.getenv(
    "MONGODB_URI"
)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

