"""
Tests for database models
"""
import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from app.models.user import User


@pytest.mark.unit
class TestUserModel:
    """Test User model"""

    def test_create_user_email_password(self, db_session):
        """Test creating a user with email and password"""
        user = User(
            email="test@example.com",
            username="testuser",
            first_name="Test",
            last_name="User",
            password_hash="hashed_password",
            is_verified=True
        )

        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.first_name == "Test"
        assert user.last_name == "User"
        assert user.password_hash == "hashed_password"
        assert user.is_verified is True
        assert user.is_active is True  # Default value
        assert user.wallet_address is None
        assert user.google_id is None
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)

    def test_create_user_wallet(self, db_session):
        """Test creating a user with wallet address"""
        wallet_address = "0x742Dc8f8B3aD2aAcf91c90F5eAE0E3F0D2aD6eD3"
        user = User(
            email=f"{wallet_address.lower()}@wallet.local",
            wallet_address=wallet_address.lower(),
            is_verified=True,
            password_hash=None
        )

        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        assert user.id is not None
        assert user.wallet_address == wallet_address.lower()
        assert user.password_hash is None
        assert user.is_verified is True
        assert user.username is None  # Can be None for wallet users

    def test_user_to_dict(self, db_session):
        """Test user to_dict method"""
        user = User(
            email="test@example.com",
            username="testuser",
            first_name="Test",
            last_name="User",
            password_hash="hashed_password",
            is_verified=True
        )

        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        user_dict = user.to_dict()

        assert isinstance(user_dict, dict)
        assert user_dict["email"] == "test@example.com"
        assert user_dict["username"] == "testuser"
        assert user_dict["firstName"] == "Test"  # camelCase conversion
        assert user_dict["lastName"] == "User"   # camelCase conversion
        assert user_dict["isVerified"] is True   # camelCase conversion
        assert user_dict["isActive"] is True     # camelCase conversion
        assert "passwordHash" not in user_dict   # Should not include password
        assert "password_hash" not in user_dict  # Should not include password
        assert "createdAt" in user_dict          # camelCase conversion
        assert "updatedAt" in user_dict          # camelCase conversion