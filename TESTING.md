# Testing Guide

This document covers the comprehensive testing setup for Sailor Swift authentication application.

## Testing Strategy

We use a three-tier testing approach:

1. **Unit Tests** - Individual components and functions
2. **Integration Tests** - API endpoints and authentication flows
3. **End-to-End Tests** - Complete user workflows

## Backend Testing (Python/pytest)

### Setup

The backend uses **pytest** for testing with the following stack:

- `pytest` - Testing framework
- `pytest-asyncio` - Async test support
- `pytest-cov` - Coverage reporting
- `httpx` - HTTP client for API testing

### Running Backend Tests

```bash
# Install dependencies (inside backend container)
cd backend
pip install -r requirements.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/auth/test_auth_routes.py

# Run specific test
pytest tests/auth/test_auth_routes.py::TestSignup::test_signup_success

# Run tests with markers
pytest -m auth          # Only auth tests
pytest -m unit          # Only unit tests
pytest -m integration   # Only integration tests
```

### Backend Test Structure

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Test configuration & fixtures
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── test_auth_routes.py  # API endpoint tests
│   │   └── test_auth_utils.py   # Utility function tests
│   └── test_models.py           # Database model tests
└── pytest.ini                  # Pytest configuration
```

### Key Test Features

**Fixtures in `conftest.py`:**
- `client` - Test HTTP client
- `db_session` - Test database session
- `sample_user_data` - Mock user data
- `auth_headers` - Authentication headers helper

**Test Categories:**
- **Authentication Routes** - Signup, login, logout, refresh, Google OAuth, wallet auth
- **Authentication Utils** - Password hashing, JWT tokens, Google token verification
- **Database Models** - User model creation, validation, relationships

**Example Test:**
```python
def test_signup_success(self, client, sample_user_data):
    """Test successful user registration"""
    response = client.post("/auth/signup", json=sample_user_data)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert "accessToken" in data
    assert "refreshToken" in data
    assert data["user"]["email"] == sample_user_data["email"]
    assert "password" not in data["user"]  # Security check
```

## Frontend Testing (Vitest + React Testing Library)

### Setup

The frontend uses **Vitest** with React Testing Library:

- `vitest` - Fast test runner (Vite-native)
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom jest matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - DOM environment for tests

### Running Frontend Tests

```bash
cd frontend

# Install dependencies
npm install

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Frontend Test Structure

```
frontend/
├── src/
│   ├── test/
│   │   ├── setup.ts           # Global test setup
│   │   └── test-utils.tsx     # Custom render function & mocks
│   ├── components/
│   │   └── ui/
│   │       └── __tests__/
│   │           └── button.test.tsx
│   ├── pages/
│   │   └── __tests__/
│   │       └── LoginPage.test.tsx
│   ├── contexts/
│   │   └── __tests__/
│   │       └── AuthContext.test.tsx
│   └── services/
│       └── __tests__/
│           └── authService.test.ts
├── vitest.config.ts           # Vitest configuration
└── package.json
```

### Key Test Features

**Custom Test Utils:**
- `render()` - Custom render with providers
- `mockUser` - Sample user data
- `mockAuthContext` - Mock authentication context
- `mockApiResponse` - Mock API responses

**Test Categories:**
- **Component Tests** - Button, forms, navigation
- **Page Tests** - Login, signup, dashboard pages
- **Context Tests** - Authentication state management
- **Service Tests** - API client functions

**Example Test:**
```typescript
test('handles form submission with valid data', async () => {
  const user = userEvent.setup()
  const mockLogin = vi.fn().mockResolvedValue(mockApiResponse.login)

  render(<LoginPage />, {
    authValue: { ...mockAuthContext, login: mockLogin }
  })

  await user.type(screen.getByLabelText(/email/i), 'test@example.com')
  await user.type(screen.getByLabelText(/password/i), 'password123')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })
})
```

## End-to-End Testing (Playwright)

### Setup

E2E tests use **Playwright** for full browser automation:

- `@playwright/test` - Cross-browser testing framework
- Tests run against real application
- Automatic server startup/shutdown
- Screenshots and traces on failure

> ⚠️ **Current Status**: E2E tests are implemented but require UI updates to pass. Tests expect `data-testid` attributes and specific text content that don't match the current component implementation.

### Running E2E Tests

```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test auth.spec.ts

# Run specific test
npx playwright test -g "should allow user login"
```

### E2E Test Structure

```
frontend/
├── tests/
│   └── e2e/
│       ├── auth.spec.ts       # Authentication flow tests
│       └── dashboard.spec.ts  # Dashboard functionality tests
└── playwright.config.ts       # Playwright configuration
```

### Key E2E Features

**Browsers Tested:**
- Chromium (Chrome)
- Firefox
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari

**Test Categories:**
- **Authentication Flows** - Signup, login, logout
- **Form Validation** - Error handling, validation messages
- **Session Management** - Persistence across refreshes
- **Route Protection** - Access control
- **Network Error Handling** - API failure scenarios

**Example E2E Test:**
```typescript
test('should allow user signup with email and password', async ({ page }) => {
  await page.goto('/signup')

  // Fill signup form
  await page.fill('[data-testid="email-input"]', 'test@example.com')
  await page.fill('[data-testid="password-input"]', 'password123')
  await page.fill('[data-testid="username-input"]', 'testuser')
  await page.fill('[data-testid="firstName-input"]', 'Test')
  await page.fill('[data-testid="lastName-input"]', 'User')

  // Submit form
  await page.click('[data-testid="signup-button"]')

  // Should redirect to dashboard on success
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Welcome, Test!')
})
```

## Testing Commands Summary

### Backend
```bash
# All backend tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific tests
pytest tests/auth/
pytest -m auth
pytest -k "signup"
```

### Frontend Unit/Integration
```bash
# All frontend tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# UI mode
npm run test:ui
```

### End-to-End
```bash
# All E2E tests
npm run test:e2e

# Debug mode
npm run test:e2e:debug

# UI mode
npm run test:e2e:ui

# Specific browser
npx playwright test --project=chromium
```

## CI/CD Integration

All tests are designed to run in CI/CD pipelines:

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and test backend
        run: |
          cd backend
          pip install -r requirements.txt
          pytest --cov=app --cov-report=xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run unit tests
        run: cd frontend && npm run test:coverage
      - name: Run E2E tests
        run: |
          docker compose up -d
          cd frontend && npm run test:e2e

  coverage:
    needs: [backend-tests, frontend-tests]
    runs-on: ubuntu-latest
    steps:
      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
```

## Coverage Goals

- **Backend**: >90% code coverage
- **Frontend**: >85% code coverage
- **E2E**: Cover all critical user journeys

## Test Data

**Important:** All tests use:
- Isolated test databases (SQLite in-memory for backend)
- Mock API responses for frontend unit tests
- Real API calls for E2E tests against test database
- No production data is used in testing

## Debugging Tests

### Backend
- Use `pytest --pdb` to drop into debugger on failures
- Add `import pytest; pytest.set_trace()` for breakpoints
- Check logs with `-s` flag: `pytest -s`

### Frontend
- Use `screen.debug()` to see DOM state
- Add `console.log()` for debugging
- Use VS Code debugger with Vitest extension

### E2E
- Use `--debug` flag to step through tests
- Screenshots are captured on failures
- Traces are recorded for debugging
- Use `page.pause()` to pause execution

## Best Practices

1. **Test Names**: Descriptive and specific
2. **Test Independence**: Each test should be isolated
3. **Mock External APIs**: Don't test third-party services
4. **Test Edge Cases**: Error conditions, validation, boundary cases
5. **Keep Tests Fast**: Unit tests < 1s, E2E tests < 10s per test
6. **Use Data Attributes**: `data-testid` for E2E test selectors
7. **Test User Behavior**: Focus on what users actually do

## Troubleshooting

### Common Issues

**Backend Tests:**
- Database connection errors: Check test database setup
- Import errors: Verify Python path configuration
- Async test failures: Ensure proper `pytest-asyncio` setup

**Frontend Tests:**
- Component not rendering: Check test setup and providers
- Async operations: Use `waitFor()` and `findBy*` queries
- Mock failures: Verify mock implementations

**E2E Tests:**
- Server not starting: Check Docker setup and ports
- Element not found: Verify selectors and wait conditions
- Flaky tests: Add proper waits and assertions

### Getting Help

- Backend: Check pytest documentation and FastAPI testing guide
- Frontend: Refer to React Testing Library and Vitest docs
- E2E: Consult Playwright documentation and examples