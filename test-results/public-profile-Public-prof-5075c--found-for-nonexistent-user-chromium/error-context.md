# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-profile.spec.ts >> Public profile >> shows not found for nonexistent user
- Location: e2e\public-profile.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.pubprofile__state-title')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('.pubprofile__state-title')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Public profile', () => {
  4  |   test('shows not found for nonexistent user', async ({ page }) => {
  5  |     await page.goto('/u/this-user-does-not-exist-xyz123');
  6  |     await page.waitForLoadState('domcontentloaded');
> 7  |     await expect(page.locator('.pubprofile__state-title')).toBeVisible({ timeout: 10000 });
     |                                                            ^ Error: expect(locator).toBeVisible() failed
  8  |     await expect(page.locator('.pubprofile__state-title')).toHaveText('Player Not Found');
  9  |   });
  10 | 
  11 |   test('back to home link works on not-found page', async ({ page }) => {
  12 |     await page.goto('/u/this-user-does-not-exist-xyz123');
  13 |     await expect(page.locator('.pubprofile__state-title')).toBeVisible({ timeout: 10000 });
  14 |     await page.locator('.pubprofile__state-link').click();
  15 |     await expect(page).toHaveURL('http://localhost:3000/', { timeout: 5000 });
  16 |   });
  17 | 
  18 |   test('profile page does not crash', async ({ page }) => {
  19 |     await page.goto('/u/someuser');
  20 |     await page.waitForLoadState('domcontentloaded');
  21 |     await expect(page.locator('.pubprofile')).toBeVisible({ timeout: 10000 });
  22 |   });
  23 | });
  24 | 
```