import { expect, test } from '@playwright/test';

test('shows the rental homepage and property navigation', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Beautiful, Move-In Ready Homes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse Properties' }).first()).toHaveAttribute('href', '/properties');
});

test('loads the Google map on the homepage', async ({ page }) => {
  await page.goto('/');

  const mapIframe = page.getByTitle('Map of Menasha, WI');
  await mapIframe.scrollIntoViewIfNeeded();
  await expect(mapIframe).toBeVisible();

  const mapFrameElement = await mapIframe.elementHandle();
  expect(mapFrameElement).not.toBeNull();

  const mapFrame = await mapFrameElement!.contentFrame();
  expect(mapFrame).not.toBeNull();

  await mapFrame!.waitForLoadState('domcontentloaded');
  expect(mapFrame!.url()).toContain('google.com/maps');
});

test('does not show an avatar on the homepage before login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open user menu' })).toHaveCount(0);
});