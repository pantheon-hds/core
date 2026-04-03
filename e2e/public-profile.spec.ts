import { test, expect } from '@playwright/test';

test.describe('Public profile', () => {
  test('shows not found for nonexistent user', async ({ page }) => {
    await page.goto('/u/this-user-does-not-exist-xyz123');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.pubprofile__state-title')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.pubprofile__state-title')).toHaveText('Player Not Found');
  });

  test('back to home link works on not-found page', async ({ page }) => {
    await page.goto('/u/this-user-does-not-exist-xyz123');
    await expect(page.locator('.pubprofile__state-title')).toBeVisible({ timeout: 10000 });
    await page.locator('.pubprofile__state-link').click();
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 5000 });
  });

  test('profile page does not crash', async ({ page }) => {
    await page.goto('/u/someuser');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.pubprofile')).toBeVisible({ timeout: 10000 });
  });
});
