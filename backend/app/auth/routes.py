from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models.user import User
from .schemas import UserSignup, UserLogin, TokenResponse, UserResponse, MessageResponse, GoogleAuthRequest, WalletConnectRequest
from .utils import hash_password, verify_password, create_access_token, create_refresh_token, get_current_user, verify_google_token, verify_wallet_signature, generate_wallet_auth_message

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup, response: Response, db: Session = Depends(get_db)):
    """Register a new user with email and password"""

    # Check if user already exists
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        password_hash=hashed_password,
        is_verified=False  # Email verification can be added later
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create tokens
    access_token = create_access_token(data={"sub": str(new_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})


    return TokenResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        user=UserResponse(**new_user.to_dict())
    )

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Login with email and password"""

    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})


    return TokenResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        user=UserResponse(**user.to_dict())
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(**current_user.to_dict())

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: dict, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    from .utils import verify_token

    try:
        # Get refresh token from request body
        refresh_token = request.get("refresh_token")
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refresh token is required"
            )

        # Verify refresh token and extract user ID
        user_id = verify_token(refresh_token)
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )

        # Create new tokens
        new_access_token = create_access_token(data={"sub": str(user.id)})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

        return TokenResponse(
            accessToken=new_access_token,
            refreshToken=new_refresh_token,
            user=UserResponse(**user.to_dict())
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/logout", response_model=MessageResponse)
async def logout():
    """Logout user - frontend handles cookie clearing"""
    return MessageResponse(message="Successfully logged out")

@router.post("/google", response_model=TokenResponse)
async def google_auth(google_data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth token"""

    # Verify Google token and get user info
    google_user_info = await verify_google_token(google_data.google_token)

    if not google_user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )

    # Check if user already exists by Google ID
    user = db.query(User).filter(User.google_id == google_user_info["google_id"]).first()

    if not user:
        # Check if user exists by email
        user = db.query(User).filter(User.email == google_user_info["email"]).first()

        if user:
            # Link Google account to existing user (preserve existing password)
            user.google_id = google_user_info["google_id"]
            if google_user_info["is_verified"]:
                user.is_verified = True
            # Don't modify password_hash - keep existing password for email login
        else:
            # Create new user
            user = User(
                email=google_user_info["email"],
                google_id=google_user_info["google_id"],
                first_name=google_user_info["first_name"],
                last_name=google_user_info["last_name"],
                is_verified=google_user_info["is_verified"],
                password_hash=None  # No password for OAuth-only users
            )
            db.add(user)

    # Update user info from Google (in case it changed)
    if google_user_info["first_name"]:
        user.first_name = google_user_info["first_name"]
    if google_user_info["last_name"]:
        user.last_name = google_user_info["last_name"]
    if google_user_info["is_verified"]:
        user.is_verified = True

    db.commit()
    db.refresh(user)

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        user=UserResponse(**user.to_dict())
    )

@router.post("/wallet", response_model=TokenResponse)
async def wallet_auth(wallet_data: dict, db: Session = Depends(get_db)):
    """Authenticate with wallet address - auto-create account if new"""

    wallet_address = wallet_data.get("wallet_address")
    if not wallet_address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wallet address is required"
        )

    # Check if user already exists by wallet address
    user = db.query(User).filter(User.wallet_address == wallet_address.lower()).first()

    if not user:
        # Create new user with wallet address
        user = User(
            email=f"{wallet_address.lower()}@wallet.local",  # Placeholder email
            wallet_address=wallet_address.lower(),
            first_name=None,
            last_name=None,
            is_verified=True,  # Wallet connection is considered verification
            password_hash=None  # No password for wallet-only users
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )

    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        accessToken=access_token,
        refreshToken=refresh_token,
        user=UserResponse(**user.to_dict())
    )