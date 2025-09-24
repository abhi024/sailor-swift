# Sailor Swift

A modern full-stack authentication application built with React TypeScript, FastAPI, and PostgreSQL.

## Features

- 🔐 **Multiple Authentication Methods**
  - Email/Password signup and login
  - Google OAuth integration
  - WalletConnect (Web3 wallet authentication)
- 🚀 **Modern Tech Stack**
  - React 18 with TypeScript
  - FastAPI with SQLAlchemy ORM
  - PostgreSQL database
  - Docker containerization
- 🔒 **Security First**
  - JWT access and refresh tokens
  - Bcrypt password hashing
  - Environment-based configuration
  - CORS protection

## Architecture

```
sailor-swift/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── auth/      # Authentication routes and utilities
│   │   ├── models/    # SQLAlchemy database models
│   │   └── main.py    # FastAPI application entry point
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/          # React TypeScript application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── services/   # API service layer
│   │   └── types/      # TypeScript type definitions
│   └── Dockerfile
├── database/          # PostgreSQL initialization
│   └── init.sql       # Database schema and seed data
└── docker-compose.yml # Multi-service orchestration
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sailor-swift
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

Required environment variables:
```env
ENVIRONMENT=development
JWT_SECRET_KEY=your-secret-key
POSTGRES_DB=your-database-name
POSTGRES_USER=your-database-user
POSTGRES_PASSWORD=your-secure-password
GOOGLE_CLIENT_ID=your-google-oauth-id
GOOGLE_CLIENT_SECRET=your-google-oauth-secret
WALLETCONNECT_PROJECT_ID=your-walletconnect-id
```

### 3. Start the Application

```bash
# Start database and backend
docker compose up -d

# View logs
docker compose logs -f
```

### 4. Access the Application

- **API Documentation**: http://localhost:8000/docs
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432
- **Frontend** (when implemented): http://localhost:3000

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/auth/signup` | Register new user |
| POST   | `/auth/login`  | User login |
| GET    | `/auth/me`     | Get current user profile |

### Example Requests

**Signup:**
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

## Development

### Running Individual Services

```bash
# Database only
docker compose up -d database

# Backend only (requires database)
docker compose up -d database backend

# View specific service logs
docker compose logs backend
```

### Database Management

Connect to PostgreSQL using any database client:
- **Host**: localhost
- **Port**: 5432
- **Database**: (from your .env)
- **Username**: (from your .env)
- **Password**: (from your .env)

### Project Commands

```bash
# Stop all services
docker compose down

# Rebuild services
docker compose up -d --build

# View all containers
docker compose ps

# Execute commands in containers
docker compose exec backend bash
docker compose exec database psql -U <username> -d <database>
```

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **Pydantic**: Data validation
- **JWT**: Token-based authentication
- **Bcrypt**: Password hashing
- **PostgreSQL**: Database

### Frontend (Planned)
- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind CSS**: Styling

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-service orchestration
- **PostgreSQL**: Database persistence

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (when implemented)
5. Submit a pull request

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ENVIRONMENT` | Application environment | Yes |
| `JWT_SECRET_KEY` | JWT token signing key | Yes |
| `POSTGRES_DB` | Database name | Yes |
| `POSTGRES_USER` | Database username | Yes |
| `POSTGRES_PASSWORD` | Database password | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No* |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | No* |
| `WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | No* |

*Required for respective authentication methods

## Security

- Environment variables are never committed (see `.gitignore`)
- Passwords are hashed using bcrypt
- JWT tokens have configurable expiration
- CORS is configured for frontend domain
- Database uses non-root user

## License

[Add your license here]

## Support

[Add support information here]