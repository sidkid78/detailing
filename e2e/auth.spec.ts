import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const customerEmail = `customer-${Date.now()}@example.com`;
  const detailerEmail = `detailer-${Date.now()}@example.com`;
  const adminEmail = `admin-${Date.now()}@example.com`;
  const password = 'password123';

  test('should allow a new user to sign up as a customer', async ({ page }) => {
    await page.goto('/signup'); // Assuming /signup is the signup page
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Assuming a successful signup redirects to a dashboard or shows a success message
    await expect(page).toHaveURL(/.*dashboard/); // Or a specific customer dashboard
    await expect(page.locator('text=Welcome')).toBeVisible(); // Or some element indicating logged in state
  });

  test('should allow a registered customer to log in and log out', async ({ page }) => {
    // First, ensure the customer exists (this would be pre-seeded in a real scenario or handled by previous test)
    // For this test, we'll assume the signup test ran, or we'd add a setup step.
    // Given the previous test creates a user, we can try to log in with that user.

    await page.goto('/login');
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*customer-dashboard/);
    await expect(page.locator('text=Welcome Customer')).toBeVisible();

    // Logout
    await page.click('button[data-testid="logout-button"]'); // Assuming a logout button with this data-testid
    await expect(page).toHaveURL(/.*login/); // Redirected to login page
    await expect(page.locator('text=Logged out successfully')).toBeVisible(); // Or a success message
  });

  test('should allow a registered detailer to log in and log out', async ({ page }) => {
    // This part assumes a detailer account is pre-existing or created via an API in a beforeAll hook.
    // For now, we'll use a placeholder email.
    await page.goto('/login');
    await page.fill('input[name="email"]', detailerEmail); // Placeholder for a detailer email
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*detailer-dashboard/);
    await expect(page.locator('text=Welcome Detailer')).toBeVisible();

    // Logout
    await page.click('button[data-testid="logout-button"]');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should allow a registered admin to log in and log out', async ({ page }) => {
    // This part assumes an admin account is pre-existing or created via an API in a beforeAll hook.
    // For now, we'll use a placeholder email.
    await page.goto('/login');
    await page.fill('input[name="email"]', adminEmail); // Placeholder for an admin email
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*admin-dashboard/);
    await expect(page.locator('text=Welcome Admin')).toBeVisible();

    // Logout
    await page.click('button[data-testid="logout-button"]');
    await expect(page).toHaveURL(/.*login/);
  });
});