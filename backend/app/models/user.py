from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from .base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(50), unique=True, nullable=True, index=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    password_hash = Column(String(255), nullable=True)  # Can be NULL for OAuth-only users
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    wallet_address = Column(String(255), unique=True, nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<User(email='{self.email}', username='{self.username}')>"

    @property
    def full_name(self):
        """Return full name if first_name and last_name are provided"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return self.username or self.email

    def to_dict(self):
        """Convert user to dictionary with camelCase keys (excluding sensitive fields)"""
        return {
            "id": str(self.id),
            "email": self.email,
            "username": self.username,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "fullName": self.full_name,
            "walletAddress": self.wallet_address,
            "isActive": self.is_active,
            "isVerified": self.is_verified,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }