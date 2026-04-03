# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.ts >> Landing pages >> beta page loads waitlist form
- Location: e2e\landing.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[type="email"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('input[type="email"]')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Landing pages', () => {
  4  |   test('home page loads with correct content', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await page.waitForLoadState('domcontentloaded');
  7  |     await expect(page).toHaveTitle(/Pantheon/i);
  8  |     await expect(page.locator('.lh__hero-title')).toBeVisible({ timeout: 10000 });
  9  |   });
  10 | 
  11 |   test('beta page loads waitlist form', async ({ page }) => {
  12 |     await page.goto('/beta');
  13 |     await page.waitForLoadState('domcontentloaded');
> 14 |     await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  15 |   });
  16 | 
  17 |   test('unknown route redirects to home', async ({ page }) => {
  18 |     await page.goto('/this-does-not-exist');
  19 |     await expect(page).toHaveURL('http://localhost:3000/', { timeout: 10000 });
  20 |   });
  21 | });
  22 | 
```