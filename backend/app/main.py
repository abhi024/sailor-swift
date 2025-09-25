from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import database and models
from .database import create_tables
from .auth import auth_router

app = FastAPI(
    title="Sailor Swift API",
    description="Authentication API with email, Google OAuth, and WalletConnect support",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    create_tables()

# Include routers
app.include_router(auth_router)

@app.get("/")
async def root():
    """API status check"""
    return {
        "message": "Sailor Swift API is running!",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT")
    }