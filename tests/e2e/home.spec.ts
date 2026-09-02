import { expect, test } from '@playwright/test';

test('shows the rental homepage and property navigation', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Beautiful, Move-In Ready Homes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse Properties' }).first()).toHaveAttribute('href', '/properties');
});

test('does not show an avatar on the homepage before login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open user menu' })).toHaveCount(0);
});