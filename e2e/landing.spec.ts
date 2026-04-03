import { test, expect } from '@playwright/test';

test.describe('Landing pages', () => {
  test('home page loads with correct content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveTitle(/Pantheon/i);
    await expect(page.locator('.lh__hero-title')).toBeVisible({ timeout: 10000 });
  });

  test('beta page loads waitlist form', async ({ page }) => {
    await page.goto('/beta');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('unknown route redirects to home', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 10000 });
  });
});
