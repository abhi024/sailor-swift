from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Request schemas (what we expect from frontend)
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    google_token: str

class WalletConnectRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str

# Response schemas (what we send back to frontend)
class UserResponse(BaseModel):
    id: str
    email: str
    username: Optional[str]
    firstName: Optional[str]
    lastName: Optional[str]
    fullName: str
    walletAddress: Optional[str]
    isActive: bool
    isVerified: bool
    createdAt: Optional[datetime]
    updatedAt: Optional[datetime]

    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy models

class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "bearer"
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refreshToken: str

class MessageResponse(BaseModel):
    message: str