# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: waitlist.spec.ts >> Waitlist form >> accepts email input
- Location: e2e\waitlist.spec.ts:15:7

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
  3  | test.describe('Waitlist form', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/beta');
  6  |     await page.waitForLoadState('domcontentloaded');
> 7  |     await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  8  |   });
  9  | 
  10 |   test('form fields are present', async ({ page }) => {
  11 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  12 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  13 |   });
  14 | 
  15 |   test('accepts email input', async ({ page }) => {
  16 |     await page.locator('input[type="email"]').fill('test@example.com');
  17 |     const value = await page.locator('input[type="email"]').inputValue();
  18 |     expect(value).toBe('test@example.com');
  19 |   });
  20 | });
  21 | 
```