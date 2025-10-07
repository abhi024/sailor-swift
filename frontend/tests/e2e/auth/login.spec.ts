import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login page
    await expect(page).toHaveURL("/login");
    await expect(page.locator("h2")).toContainText("Sign in to your account");
  });

  test("should allow user login with email and password", async ({ page }) => {
    // First create a user by going to signup
    const timestamp = Date.now();
    const email = `login${timestamp}@example.com`;
    const password = "Password123!";

    await page.goto("/signup");
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="signup-button"]');

    // Wait for redirect and then logout
    await expect(page).toHaveURL("/dashboard");
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL("/login");

    // Now test login
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard on success
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText(
      "Welcome"
    );
  });

  test("should show validation errors for invalid login data", async ({
    page,
  }) => {
    // Try to submit empty form
    await page.click('[data-testid="login-button"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      "Email is required"
    );
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      "Password is required"
    );
  });

  test("should show error for invalid login credentials", async ({ page }) => {
    // Fill form with invalid credentials
    await page.fill('[data-testid="email-input"]', "invalid@example.com");
    await page.fill('[data-testid="password-input"]', "WrongPassword123!");
    await page.click('[data-testid="login-button"]');

    // Wait for error message to appear (with 1s timeout)
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test("should show loading states during authentication", async ({ page }) => {
    // First create a user
    const timestamp = Date.now();
    const email = `loading${timestamp}@example.com`;
    const password = "Password123!";

    await page.goto("/signup");
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="signup-button"]');
    await expect(page).toHaveURL("/dashboard");
    await page.click('[data-testid="logout-button"]');

    // Now test loading state
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);

    // Submit form and check loading state (may be too fast, so we check if button is disabled)
    await page.click('[data-testid="login-button"]');

    // Button should be disabled during submission
    await expect(page.locator('[data-testid="login-button"]')).toBeDisabled();
  });

  test("should navigate to signup page", async ({ page }) => {
    // Click signup link
    await page.click('[data-testid="signup-link"]');
    await expect(page).toHaveURL("/signup");
    await expect(page.locator("h2")).toContainText("Create your account");
  });
});
