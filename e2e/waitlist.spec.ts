import { test, expect } from '@playwright/test';

test.describe('Waitlist form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/beta');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('form fields are present', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('accepts email input', async ({ page }) => {
    await page.locator('input[type="email"]').fill('test@example.com');
    const value = await page.locator('input[type="email"]').inputValue();
    expect(value).toBe('test@example.com');
  });
});
