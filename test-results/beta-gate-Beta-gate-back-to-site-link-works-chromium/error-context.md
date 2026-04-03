# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: beta-gate.spec.ts >> Beta gate >> back to site link works
- Location: e2e\beta-gate.spec.ts:25:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.welcome__beta-back')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Beta gate', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/app');
  6  |     await page.evaluate(() => localStorage.clear());
  7  |     await page.reload();
  8  |     await page.waitForLoadState('domcontentloaded');
  9  |   });
  10 | 
  11 |   test('shows access code form when not unlocked', async ({ page }) => {
  12 |     await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
  13 |   });
  14 | 
  15 |   test('shows Steam login button on beta gate screen', async ({ page }) => {
  16 |     await expect(page.locator('.steam-auth__btn')).toBeVisible({ timeout: 10000 });
  17 |   });
  18 | 
  19 |   test('shows error for invalid invite code', async ({ page }) => {
  20 |     await page.locator('input[type="password"]').fill('INVALID-CODE-HERE');
  21 |     await page.locator('.welcome__beta-btn').click();
  22 |     await expect(page.locator('.welcome__beta-error')).toBeVisible({ timeout: 10000 });
  23 |   });
  24 | 
  25 |   test('back to site link works', async ({ page }) => {
> 26 |     await page.locator('.welcome__beta-back').click();
     |                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  27 |     await expect(page).toHaveURL('http://localhost:3000/', { timeout: 5000 });
  28 |   });
  29 | });
  30 | 
```