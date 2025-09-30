import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    await page.goto('/')
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login page
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('Welcome back')
  })

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

  test('should allow user login with email and password', async ({ page }) => {
    // First create a user by going to signup
    await page.goto('/signup')
    await page.fill('[data-testid="email-input"]', 'login-test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.fill('[data-testid="username-input"]', 'loginuser')
    await page.fill('[data-testid="firstName-input"]', 'Login')
    await page.fill('[data-testid="lastName-input"]', 'User')
    await page.click('[data-testid="signup-button"]')

    // Wait for redirect and then logout
    await expect(page).toHaveURL('/dashboard')
    await page.click('[data-testid="logout-button"]')
    await expect(page).toHaveURL('/login')

    // Now test login
    await page.fill('[data-testid="email-input"]', 'login-test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    // Should redirect to dashboard on success
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Welcome, Login!')
  })

  test('should show validation errors for invalid signup data', async ({ page }) => {
    await page.goto('/signup')

    // Try to submit empty form
    await page.click('[data-testid="signup-button"]')

    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required')
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required')
    await expect(page.locator('[data-testid="username-error"]')).toContainText('Username is required')
  })

  test('should show validation errors for invalid login data', async ({ page }) => {
    await page.goto('/login')

    // Try to submit empty form
    await page.click('[data-testid="login-button"]')

    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required')
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required')
  })

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill form with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })

  test('should prevent duplicate email signup', async ({ page }) => {
    // First signup
    await page.goto('/signup')
    await page.fill('[data-testid="email-input"]', 'duplicate@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.fill('[data-testid="username-input"]', 'duplicate1')
    await page.fill('[data-testid="firstName-input"]', 'Duplicate')
    await page.fill('[data-testid="lastName-input"]', 'User')
    await page.click('[data-testid="signup-button"]')

    await expect(page).toHaveURL('/dashboard')

    // Logout
    await page.click('[data-testid="logout-button"]')

    // Try to signup again with same email
    await page.goto('/signup')
    await page.fill('[data-testid="email-input"]', 'duplicate@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.fill('[data-testid="username-input"]', 'duplicate2')
    await page.fill('[data-testid="firstName-input"]', 'Duplicate2')
    await page.fill('[data-testid="lastName-input"]', 'User2')
    await page.click('[data-testid="signup-button"]')

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already registered')
  })

  test('should maintain session across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/signup')
    await page.fill('[data-testid="email-input"]', 'session-test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.fill('[data-testid="username-input"]', 'sessionuser')
    await page.fill('[data-testid="firstName-input"]', 'Session')
    await page.fill('[data-testid="lastName-input"]', 'User')
    await page.click('[data-testid="signup-button"]')

    await expect(page).toHaveURL('/dashboard')

    // Refresh page
    await page.reload()

    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Welcome, Session!')
  })

  test('should logout successfully and redirect to login', async ({ page }) => {
    // Login first
    await page.goto('/signup')
    await page.fill('[data-testid="email-input"]', 'logout-test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.fill('[data-testid="username-input"]', 'logoutuser')
    await page.fill('[data-testid="firstName-input"]', 'Logout')
    await page.fill('[data-testid="lastName-input"]', 'User')
    await page.click('[data-testid="signup-button"]')

    await expect(page).toHaveURL('/dashboard')

    // Logout
    await page.click('[data-testid="logout-button"]')

    // Should redirect to login
    await expect(page).toHaveURL('/login')

    // Try to access dashboard again - should redirect back to login
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('should navigate between login and signup pages', async ({ page }) => {
    await page.goto('/login')

    // Click signup link
    await page.click('[data-testid="signup-link"]')
    await expect(page).toHaveURL('/signup')
    await expect(page.locator('h1')).toContainText('Create your account')

    // Click login link
    await page.click('[data-testid="login-link"]')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('Welcome back')
  })

  test('should show loading states during authentication', async ({ page }) => {
    await page.goto('/login')

    // Fill form
    await page.fill('[data-testid="email-input"]', 'loading-test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')

    // Submit form and check loading state
    await page.click('[data-testid="login-button"]')

    // Should show loading text and disable button
    await expect(page.locator('[data-testid="login-button"]')).toContainText('Signing in...')
    await expect(page.locator('[data-testid="login-button"]')).toBeDisabled()
  })

  test('should display user profile information correctly', async ({ page }) => {
    // Signup
    await page.goto('/signup')
    await page.fill('[data-testid="email-input"]', 'profile-test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.fill('[data-testid="username-input"]', 'profileuser')
    await page.fill('[data-testid="firstName-input"]', 'Profile')
    await page.fill('[data-testid="lastName-input"]', 'User')
    await page.click('[data-testid="signup-button"]')

    await expect(page).toHaveURL('/dashboard')

    // Check profile information is displayed
    await expect(page.locator('[data-testid="user-email"]')).toContainText('profile-test@example.com')
    await expect(page.locator('[data-testid="user-username"]')).toContainText('profileuser')
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Profile User')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/auth/login', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'error-test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Internal server error')
  })
})

test.describe('Dashboard Access Control', () => {
  test('should protect dashboard routes', async ({ page }) => {
    const protectedRoutes = ['/dashboard', '/profile', '/settings']

    for (const route of protectedRoutes) {
      await page.goto(route)
      // Should redirect to login
      await expect(page).toHaveURL('/login')
    }
  })

  test('should allow access to public routes', async ({ page }) => {
    const publicRoutes = ['/', '/login', '/signup']

    for (const route of publicRoutes) {
      await page.goto(route)
      // Should stay on the route (not redirect)
      await expect(page).toHaveURL(route === '/' ? '/login' : route) // Root redirects to login
    }
  })
})