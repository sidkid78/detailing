import { test, expect } from '@playwright/test';

test.describe('Booking Process', () => {
  const customerEmail = `booking-customer-${Date.now()}@example.com`;
  const password = 'password123';

  // Helper function to log in a customer
  async function loginCustomer(page: any, email: string) {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*customer-dashboard/);
  }

  test('should allow a customer to complete the multi-step booking flow', async ({ page }) => {
    // 1. Sign up and log in a new customer for this booking test
    await page.goto('/signup');
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/); // Or customer dashboard directly

    // Now, navigate to the booking page
    await page.goto('/book'); // Assuming /book is the booking start page

    // Step 1: Select Service
    await page.locator('button', { hasText: 'Exterior Wash' }).click(); // Example service
    await page.click('button[data-testid="next-step-button"]');
    await expect(page.locator('text=Select Vehicle')).toBeVisible();

    // Step 2: Select Vehicle Type
    await page.locator('label', { hasText: 'Sedan' }).click(); // Example vehicle type
    await page.fill('input[name="vehicleMake"]', 'Toyota');
    await page.fill('input[name="vehicleModel"]', 'Camry');
    await page.fill('input[name="vehicleColor"]', 'Blue');
    await page.click('button[data-testid="next-step-button"]');
    await expect(page.locator('text=Select Date & Time')).toBeVisible();

    // Step 3: Select Date and Time
    // This is often tricky with date pickers. For simplicity, we'll assume direct input or a clickable element.
    // A more robust test would interact with a calendar component.
    const desiredDate = '2024-12-25'; // Example future date
    const desiredTime = '10:00 AM'; // Example time

    // Assuming a date input field
    await page.fill('input[name="bookingDate"]', desiredDate);
    // Assuming a time input field or selection
    await page.selectOption('select[name="bookingTime"]', { label: desiredTime });
    await page.click('button[data-testid="next-step-button"]');
    await expect(page.locator('text=Confirm Details')).toBeVisible();

    // Step 4: Confirm Details & Place Booking
    // Verify displayed details match selections
    await expect(page.locator('text=Exterior Wash')).toBeVisible();
    await expect(page.locator('text=Sedan, Toyota Camry, Blue')).toBeVisible();
    await expect(page.locator(`text=${desiredDate} at ${desiredTime}`)).toBeVisible();

    await page.click('button[data-testid="confirm-booking-button"]');

    // Assuming a successful booking redirects to a confirmation page or customer dashboard
    await expect(page).toHaveURL(/.*booking-confirmation|customer-dashboard/);
    await expect(page.locator('text=Booking Confirmed!')).toBeVisible();

    // Verify the booking appears in the customer's dashboard
    await page.goto('/customer-dashboard'); // Go to customer dashboard directly
    await expect(page.locator('text=Your Bookings')).toBeVisible();
    // Look for the newly created booking details
    await expect(page.locator(`text=Exterior Wash on ${new Date(desiredDate).toLocaleDateString()}`)).toBeVisible();
    await expect(page.locator(`text=${desiredTime}`)).toBeVisible();
  });
});