import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models.base import Base

# Get environment configuration from .env file
ENVIRONMENT = os.getenv("ENVIRONMENT")

# Build DATABASE_URL from individual components
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_DB = os.getenv("POSTGRES_DB")

# Use 'database' hostname for Docker, can be overridden with DB_HOST
DB_HOST = os.getenv("DB_HOST") or "database"  # docker-compose service name
DB_PORT = os.getenv("DB_PORT") or "5432"

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{DB_HOST}:{DB_PORT}/{POSTGRES_DB}"

# Create SQLAlchemy engine with environment-specific settings
engine = create_engine(
    DATABASE_URL,
    echo=ENVIRONMENT == "development",  # Show SQL queries only in development
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=300,  # Recycle connections every 5 minutes
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Additional connections when needed
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """
    Dependency function to get database session
    Used with FastAPI's dependency injection system
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_url():
    """Get the current database URL (useful for debugging)"""
    return DATABASE_URL