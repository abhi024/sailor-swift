import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should maintain session across page refreshes", async ({ page }) => {
    // Signup
    const timestamp = Date.now();
    const email = `session${timestamp}@example.com`;
    const password = "Password123!";

    await page.goto("/signup");
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="signup-button"]');

    await expect(page).toHaveURL("/dashboard");

    // Refresh page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText(
      "Welcome"
    );
  });

  test("should logout successfully and redirect to login", async ({ page }) => {
    // Signup first
    const timestamp = Date.now();
    const email = `logout${timestamp}@example.com`;
    const password = "Password123!";

    await page.goto("/signup");
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="signup-button"]');

    await expect(page).toHaveURL("/dashboard");

    // Logout
    await page.click('[data-testid="logout-button"]');

    // Should redirect to login
    await expect(page).toHaveURL("/login");

    // Try to access dashboard again - should redirect back to login
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("should display user profile information correctly", async ({
    page,
  }) => {
    // Signup
    const timestamp = Date.now();
    const email = `profile${timestamp}@example.com`;
    const password = "Password123!";

    await page.goto("/signup");
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="signup-button"]');

    await expect(page).toHaveURL("/dashboard");

    // Check profile information is displayed
    await expect(page.locator('[data-testid="user-email"]')).toContainText(
      email
    );
  });

  test("should protect dashboard routes", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login
    await expect(page).toHaveURL("/login");
  });
});
