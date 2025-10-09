import os
from datetime import datetime, timedelta
from typing import Optional, Dict
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import httpx
import hashlib
import re
from eth_account.messages import encode_defunct
from eth_account import Account

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create a JWT refresh token (longer expiry)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None

# HTTP Bearer token scheme
security = HTTPBearer()

def get_current_user_dependency():
    """Create the get_current_user dependency function"""
    from ..database import get_db
    from ..models.user import User

    def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
    ):
        """Get current user from JWT token"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        # Verify token
        user_id = verify_token(credentials.credentials)
        if user_id is None:
            raise credentials_exception

        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise credentials_exception

        return user

    return get_current_user

# Create the dependency
get_current_user = get_current_user_dependency()

# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

async def verify_google_token(credential: str) -> Optional[Dict]:
    """Verify Google OAuth JWT credential and return user info"""
    try:
        # Use Google's tokeninfo endpoint to verify the JWT credential
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={credential}"
            )

            if response.status_code == 200:
                user_data = response.json()

                # Verify required fields are present
                if not user_data.get("sub") or not user_data.get("email"):
                    print(f"Google token missing required fields: {user_data}")
                    return None

                # Verify the token is for our app
                if user_data.get("aud") != GOOGLE_CLIENT_ID:
                    print(f"Token audience mismatch: {user_data.get('aud')} != {GOOGLE_CLIENT_ID}")
                    return None

                return {
                    "google_id": user_data.get("sub"),  # 'sub' is the user ID in JWT
                    "email": user_data.get("email"),
                    "first_name": user_data.get("given_name"),
                    "last_name": user_data.get("family_name"),
                    "is_verified": user_data.get("email_verified", False)
                }
    except Exception as e:
        print(f"Google token verification error: {e}")

    return None

def verify_wallet_signature(wallet_address: str, message: str, signature: str) -> bool:
    """Verify Ethereum wallet signature"""
    try:
        # Create the message hash that was signed
        message_hash = encode_defunct(text=message)

        # Recover the address from signature
        recovered_address = Account.recover_message(message_hash, signature=signature)

        # Compare recovered address with claimed address (case insensitive)
        return recovered_address.lower() == wallet_address.lower()
    except Exception as e:
        print(f"Wallet signature verification error: {e}")
        return False

def generate_wallet_auth_message(nonce: str) -> str:
    """Generate a message for wallet authentication"""
    return f"Sign this message to authenticate with Sailor Swift: {nonce}"