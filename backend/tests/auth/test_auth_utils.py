"""
Tests for authentication utilities
"""
import pytest
from unittest.mock import patch, Mock
from datetime import datetime, timedelta
from jose import jwt, JWTError

from app.auth.utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    verify_google_token
)
# No TokenData schema exists, so no need to import it


@pytest.mark.unit
class TestPasswordHashing:
    """Test password hashing utilities"""

    def test_hash_password(self):
        """Test password hashing"""
        password = "testpassword123"
        hashed = hash_password(password)

        assert hashed != password
        assert len(hashed) > 20  # bcrypt hashes are long
        assert hashed.startswith('$2b$')  # bcrypt format

    def test_verify_password_correct(self):
        """Test password verification with correct password"""
        password = "testpassword123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password"""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False

    def test_hash_password_consistency(self):
        """Test that hash_password produces consistent results for verification"""
        password = "testpassword123"
        hashed = hash_password(password)

        # Should always verify the same password
        assert verify_password(password, hashed) is True
        # Different password should fail
        assert verify_password("different", hashed) is False


@pytest.mark.unit
class TestJWTTokens:
    """Test JWT token creation and verification"""

    def test_create_access_token(self):
        """Test access token creation"""
        user_id = "123"
        token = create_access_token(data={"sub": user_id})

        assert isinstance(token, str)
        assert len(token) > 50  # JWT tokens are long

        # Token should be valid
        import os
        SECRET_KEY = os.getenv("JWT_SECRET_KEY")
        ALGORITHM = "HS256"
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == user_id
        assert "exp" in payload

    def test_create_refresh_token(self):
        """Test refresh token creation"""
        user_id = "123"
        token = create_refresh_token(data={"sub": user_id})

        assert isinstance(token, str)
        assert len(token) > 50

        # Token should be valid with longer expiration
        import os
        SECRET_KEY = os.getenv("JWT_SECRET_KEY")
        ALGORITHM = "HS256"
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == user_id
        assert "exp" in payload

    def test_create_token_with_custom_expires(self):
        """Test token creation with custom expiration"""
        user_id = "123"
        expires_delta = timedelta(minutes=5)
        token = create_access_token(data={"sub": user_id}, expires_delta=expires_delta)

        import os
        SECRET_KEY = os.getenv("JWT_SECRET_KEY")
        ALGORITHM = "HS256"
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Check expiration time is roughly 5 minutes from now
        exp_time = datetime.fromtimestamp(payload["exp"])
        expected_time = datetime.utcnow() + expires_delta
        time_diff = abs((exp_time - expected_time).total_seconds())
        assert time_diff < 60  # Within 1 minute tolerance

    def test_verify_token_valid(self):
        """Test token verification with valid token"""
        user_id = "123"
        token = create_access_token(data={"sub": user_id})

        # verify_token returns the user_id string
        result = verify_token(token)
        assert result == user_id

    def test_verify_token_invalid(self):
        """Test token verification with invalid token"""
        invalid_token = "invalid.token.here"

        # verify_token returns None for invalid tokens
        result = verify_token(invalid_token)
        assert result is None

    def test_verify_token_expired(self):
        """Test token verification with expired token"""
        user_id = "123"
        # Create token that expires immediately
        expires_delta = timedelta(seconds=-1)
        token = create_access_token(data={"sub": user_id}, expires_delta=expires_delta)

        # verify_token returns None for expired tokens
        result = verify_token(token)
        assert result is None


@pytest.mark.unit
@patch('httpx.AsyncClient.get')
class TestGoogleTokenVerification:
    """Test Google OAuth token verification"""

    @patch('app.auth.utils.GOOGLE_CLIENT_ID', 'mock-client-id')
    @pytest.mark.asyncio
    async def test_verify_google_token_success(self, mock_get):
        """Test successful Google token verification"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'aud': 'mock-client-id',  # Should match the mocked GOOGLE_CLIENT_ID
            'email': 'test@gmail.com',
            'given_name': 'Test',
            'family_name': 'User',
            'sub': 'google-user-id-123',
            'email_verified': True
        }
        mock_get.return_value = mock_response

        result = await verify_google_token('mock-google-token')

        assert result['email'] == 'test@gmail.com'
        assert result['first_name'] == 'Test'
        assert result['last_name'] == 'User'
        assert result['google_id'] == 'google-user-id-123'
        assert result['is_verified'] == True

    @patch('app.auth.utils.GOOGLE_CLIENT_ID', 'mock-client-id')
    @pytest.mark.asyncio
    async def test_verify_google_token_unverified_email(self, mock_get):
        """Test Google token with unverified email"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'aud': 'mock-client-id',
            'email': 'test@gmail.com',
            'given_name': 'Test',
            'family_name': 'User',
            'sub': 'google-user-id-123',
            'email_verified': False  # Email not verified
        }
        mock_get.return_value = mock_response

        result = await verify_google_token('mock-google-token')

        # Function still returns the data even if email is not verified
        # It just sets is_verified to False
        assert result['email'] == 'test@gmail.com'
        assert result['is_verified'] == False

    @pytest.mark.asyncio
    async def test_verify_google_token_http_error(self, mock_get):
        """Test Google token verification with HTTP error"""
        # Mock the response to simulate an HTTP error (non-200 status)
        mock_response = Mock()
        mock_response.status_code = 500
        mock_get.return_value = mock_response

        # Should return None for non-200 responses
        result = await verify_google_token('mock-google-token')
        assert result is None

    @pytest.mark.asyncio
    async def test_verify_google_token_invalid_response(self, mock_get):
        """Test Google token verification with invalid response"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {}  # Empty response (missing required fields)
        mock_get.return_value = mock_response

        # Should return None for responses missing required fields
        result = await verify_google_token('mock-google-token')
        assert result is None

