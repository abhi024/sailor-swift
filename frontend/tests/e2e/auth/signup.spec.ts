import { test, expect } from "@playwright/test";

test.describe("Signup Page", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.goto("/signup");
  });

  test("should allow user signup with email and password", async ({ page }) => {
    // Fill signup form
    const timestamp = Date.now();
    await page.fill(
      '[data-testid="email-input"]',
      `test${timestamp}@example.com`
    );
    await page.fill('[data-testid="password-input"]', "Password123!");

    // Submit form
    await page.click('[data-testid="signup-button"]');

    // Should redirect to dashboard on success
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText(
      "Welcome"
    );
  });

  test("should show validation errors for invalid signup data", async ({
    page,
  }) => {
    // Try to submit empty form
    await page.click('[data-testid="signup-button"]');

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

  test("should prevent duplicate email signup", async ({ page }) => {
    // First signup
    const timestamp = Date.now();
    const email = `duplicate${timestamp}@example.com`;
    const password = "Password123!";

    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="signup-button"]');

    await expect(page).toHaveURL("/dashboard");

    // Logout
    await page.click('[data-testid="logout-button"]');

    // Try to signup again with same email
    await page.goto("/signup");
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="signup-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    // Click login link
    await page.click('[data-testid="login-link"]');
    await expect(page).toHaveURL("/login");
    await expect(page.locator("h2")).toContainText("Sign in to your account");
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Intercept API calls and return error
    await page.route("**/auth/signup", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Server error" }),
      });
    });

    await page.fill('[data-testid="email-input"]', "error-test@example.com");
    await page.fill('[data-testid="password-input"]', "Password123!");
    await page.click('[data-testid="signup-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
