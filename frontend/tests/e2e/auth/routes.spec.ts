import { test, expect } from "@playwright/test";

test.describe("Route Access Control", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("should allow access to public routes when not authenticated", async ({
    page,
  }) => {
    const publicRoutes = ["/login", "/signup"];

    for (const route of publicRoutes) {
      await page.goto(route);
      // Should stay on the route (not redirect)
      await expect(page).toHaveURL(route);
    }
  });

  test("should redirect root to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("should redirect to login when accessing protected routes while not authenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("should redirect authenticated users from login to dashboard", async ({
    page,
  }) => {
    // First signup/login
    const timestamp = Date.now();
    const email = `redirect${timestamp}@example.com`;
    const password = "Password123!";

    await page.goto("/signup");
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="signup-button"]');

    await expect(page).toHaveURL("/dashboard");

    // Try to access login page while authenticated
    await page.goto("/login");
    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should redirect authenticated users from signup to dashboard", async ({
    page,
  }) => {
    // First signup/login
    const timestamp = Date.now();
    const email = `redirect2${timestamp}@example.com`;
    const password = "Password123!";

    await page.goto("/signup");
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="signup-button"]');

    await expect(page).toHaveURL("/dashboard");

    // Try to access signup page while authenticated
    await page.goto("/signup");
    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
  });
});
