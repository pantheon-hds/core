import { test, expect } from '@playwright/test';

test.describe('Beta gate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows access code form when not unlocked', async ({ page }) => {
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
  });

  test('shows Steam login button on beta gate screen', async ({ page }) => {
    await expect(page.locator('.steam-auth__btn')).toBeVisible({ timeout: 10000 });
  });

  test('shows error for invalid invite code', async ({ page }) => {
    await page.locator('input[type="password"]').fill('INVALID-CODE-HERE');
    await page.locator('.welcome__beta-btn').click();
    await expect(page.locator('.welcome__beta-error')).toBeVisible({ timeout: 10000 });
  });

  test('back to site link works', async ({ page }) => {
    await page.locator('.welcome__beta-back').click();
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 5000 });
  });
});
