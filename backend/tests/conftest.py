"""
Test configuration and fixtures for the Sailor Swift backend tests
"""
import os
import pytest
import asyncio
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
# Removed StaticPool import as it's SQLite-specific

from app.main import app
from app.database import get_db, Base
from app.models.user import User

# Test database URL - using PostgreSQL for tests (same as production)
SQLALCHEMY_DATABASE_URL = "postgresql://sailor_admin:abb6ec84ddc9c17c8612c9d84046ffaeb565f8a910640ddd@database:5432/sailor_swift_test_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with test database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "password": "securepassword123",
        "username": "testuser",
        "firstName": "Test",
        "lastName": "User"
    }


@pytest.fixture
def sample_login_data():
    """Sample login data for testing."""
    return {
        "email": "test@example.com",
        "password": "securepassword123"
    }


@pytest.fixture
def sample_wallet_address():
    """Sample wallet address for testing."""
    return "0x742Dc8f8B3aD2aAcf91c90F5eAE0E3F0D2aD6eD3"


@pytest.fixture
def auth_headers():
    """Helper to create auth headers."""
    def _auth_headers(token: str):
        return {"Authorization": f"Bearer {token}"}
    return _auth_headers


@pytest.fixture
def mock_google_token():
    """Mock Google OAuth token for testing."""
    return "mock-google-token-12345"