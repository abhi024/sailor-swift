"""
Tests for authentication routes
"""
import asyncio
import pytest
from unittest.mock import patch, Mock, AsyncMock
from fastapi import status
from sqlalchemy.orm import Session

from app.models.user import User
from app.auth.utils import verify_password, hash_password


@pytest.mark.auth
class TestSignup:
    """Test user registration endpoint"""

    def test_signup_success(self, client, sample_user_data):
        """Test successful user registration"""
        response = client.post("/auth/signup", json=sample_user_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "accessToken" in data
        assert "refreshToken" in data
        assert "user" in data
        assert data["user"]["email"] == sample_user_data["email"]
        assert data["user"]["username"] == sample_user_data["username"]
        assert data["user"]["firstName"] == sample_user_data["firstName"]
        assert data["user"]["lastName"] == sample_user_data["lastName"]
        assert "password" not in data["user"]

    def test_signup_duplicate_email(self, client, sample_user_data, db_session):
        """Test registration with existing email"""
        # First registration
        client.post("/auth/signup", json=sample_user_data)

        # Attempt duplicate registration
        response = client.post("/auth/signup", json=sample_user_data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["detail"] == "Email already registered"

    def test_signup_invalid_data(self, client):
        """Test registration with invalid data"""
        invalid_data = {
            "email": "invalid-email",
            "password": "123",  # too short
            "username": "",
            "firstName": "",
            "lastName": ""
        }

        response = client.post("/auth/signup", json=invalid_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_signup_missing_fields(self, client):
        """Test registration with missing required fields"""
        incomplete_data = {
            "email": "test@example.com"
            # Missing password, username, etc.
        }

        response = client.post("/auth/signup", json=incomplete_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.auth
class TestLogin:
    """Test user login endpoint"""

    def test_login_success(self, client, sample_user_data, sample_login_data):
        """Test successful login"""
        # Register user first
        client.post("/auth/signup", json=sample_user_data)

        # Login
        response = client.post("/auth/login", json=sample_login_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "accessToken" in data
        assert "refreshToken" in data
        assert "user" in data
        assert data["user"]["email"] == sample_login_data["email"]

    def test_login_wrong_password(self, client, sample_user_data):
        """Test login with wrong password"""
        # Register user first
        client.post("/auth/signup", json=sample_user_data)

        # Login with wrong password
        wrong_login = {
            "email": sample_user_data["email"],
            "password": "wrongpassword"
        }
        response = client.post("/auth/login", json=wrong_login)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Invalid email or password"

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent email"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "password123"
        }

        response = client.post("/auth/login", json=login_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Invalid email or password"

    def test_login_inactive_user(self, client, sample_user_data, sample_login_data, db_session):
        """Test login with inactive user"""
        # Register user
        client.post("/auth/signup", json=sample_user_data)

        # Deactivate user
        user = db_session.query(User).filter(User.email == sample_user_data["email"]).first()
        user.is_active = False
        db_session.commit()

        # Try to login
        response = client.post("/auth/login", json=sample_login_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Account is deactivated"


@pytest.mark.auth
class TestMe:
    """Test get current user endpoint"""

    def test_me_success(self, client, sample_user_data, auth_headers):
        """Test getting current user info"""
        # Register and get token
        signup_response = client.post("/auth/signup", json=sample_user_data)
        token = signup_response.json()["accessToken"]

        # Get user info
        response = client.get("/auth/me", headers=auth_headers(token))

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == sample_user_data["email"]
        assert data["username"] == sample_user_data["username"]

    def test_me_no_token(self, client):
        """Test getting user info without token"""
        response = client.get("/auth/me")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.json()["detail"] == "Not authenticated"

    def test_me_invalid_token(self, client, auth_headers):
        """Test getting user info with invalid token"""
        response = client.get("/auth/me", headers=auth_headers("invalid-token"))
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.auth
class TestRefresh:
    """Test token refresh endpoint"""

    def test_refresh_success(self, client, sample_user_data):
        """Test successful token refresh"""
        # Register and get tokens
        signup_response = client.post("/auth/signup", json=sample_user_data)
        refresh_token = signup_response.json()["refreshToken"]

        # Refresh token
        response = client.post("/auth/refresh", json={"refreshToken": refresh_token})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "accessToken" in data
        assert "refreshToken" in data

    def test_refresh_invalid_token(self, client):
        """Test refresh with invalid token"""
        response = client.post("/auth/refresh", json={"refreshToken": "invalid-token"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.auth
class TestLogout:
    """Test user logout endpoint"""

    def test_logout_success(self, client, sample_user_data, auth_headers):
        """Test successful logout"""
        # Register and get token
        signup_response = client.post("/auth/signup", json=sample_user_data)
        token = signup_response.json()["accessToken"]

        # Logout
        response = client.post("/auth/logout", headers=auth_headers(token))

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Successfully logged out"


@pytest.mark.auth
class TestGoogleAuth:
    """Test Google OAuth authentication"""

    @patch('app.auth.routes.verify_google_token', new_callable=AsyncMock)
    def test_google_auth_success_new_user(self, mock_verify_google, client):
        """Test Google auth with new user"""
        # Mock Google token verification
        mock_verify_google.return_value = {
            'email': 'google@example.com',
            'first_name': 'Google',
            'last_name': 'User',
            'google_id': 'google-user-id-123',
            'is_verified': True
        }

        google_auth_data = {
            "google_token": "mock-google-credential"
        }

        response = client.post("/auth/google", json=google_auth_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "accessToken" in data
        assert "refreshToken" in data
        assert "user" in data
        assert data["user"]["email"] == "google@example.com"

    @patch('app.auth.routes.verify_google_token', new_callable=AsyncMock)
    def test_google_auth_success_existing_user(self, mock_verify_google, client, sample_user_data):
        """Test Google auth with existing user"""
        # Register user first
        client.post("/auth/signup", json=sample_user_data)

        # Mock Google token verification with same email
        mock_verify_google.return_value = {
            'email': sample_user_data['email'],
            'first_name': 'Google',
            'last_name': 'User',
            'google_id': 'google-user-id-123',
            'is_verified': True
        }

        google_auth_data = {
            "google_token": "mock-google-credential"
        }

        response = client.post("/auth/google", json=google_auth_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user"]["email"] == sample_user_data["email"]

    @patch('app.auth.routes.verify_google_token', new_callable=AsyncMock)
    def test_google_auth_invalid_token(self, mock_verify_google, client):
        """Test Google auth with invalid token"""
        mock_verify_google.return_value = None

        google_auth_data = {
            "google_token": "invalid-google-credential"
        }

        response = client.post("/auth/google", json=google_auth_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.auth
class TestWalletAuth:
    """Test Web3 wallet authentication"""

    def test_wallet_auth_success_new_user(self, client, sample_wallet_address):
        """Test wallet auth with new wallet address"""
        wallet_data = {
            "wallet_address": sample_wallet_address
        }

        response = client.post("/auth/wallet", json=wallet_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "accessToken" in data
        assert "refreshToken" in data
        assert "user" in data
        assert data["user"]["walletAddress"] == sample_wallet_address.lower()

    def test_wallet_auth_success_existing_user(self, client, sample_wallet_address):
        """Test wallet auth with existing wallet address"""
        # First authentication creates user
        wallet_data = {"wallet_address": sample_wallet_address}
        client.post("/auth/wallet", json=wallet_data)

        # Second authentication with same wallet
        response = client.post("/auth/wallet", json=wallet_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user"]["walletAddress"] == sample_wallet_address.lower()

    def test_wallet_auth_missing_address(self, client):
        """Test wallet auth without wallet address"""
        response = client.post("/auth/wallet", json={})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["detail"] == "Wallet address is required"

    def test_wallet_auth_invalid_address(self, client):
        """Test wallet auth with invalid wallet address"""
        wallet_data = {
            "wallet_address": "invalid-address"
        }

        response = client.post("/auth/wallet", json=wallet_data)

        # Should still work but normalize the address
        assert response.status_code == status.HTTP_200_OK