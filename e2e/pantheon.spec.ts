import { test, expect } from '@playwright/test';

test.describe('Pantheon page', () => {
  test('loads without crashing', async ({ page }) => {
    // Pantheon is inside the app — unlock beta gate first
    await page.goto('/app');
    await page.evaluate(() => localStorage.setItem('pantheon_beta', 'true'));
    await page.goto('/app');
    // App shows — no white screen, no unhandled error
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
